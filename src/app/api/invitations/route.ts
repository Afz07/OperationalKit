import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/org";
import { enqueueJob, JOB_NAMES } from "@/lib/jobs";
import { assertCanAddMember, assertWithinJobQuota, LimitError } from "@/lib/limits";
import { MemberRole } from "@prisma/client";
import { z } from "zod";
import { addDays } from "date-fns";

const inviteSchema = z.object({
  email: z.string().email(),
  orgSlug: z.string(),
  role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { email, orgSlug, role } = parsed.data;

  // Only admins/owners can invite
  const membership = await requireOrgRole(orgSlug, MemberRole.ADMIN).catch(
    () => null
  );
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enforce Free-tier limits (lifted for Pro organizations).
  try {
    await assertCanAddMember(membership.organizationId);
    await assertWithinJobQuota(membership.organizationId);
  } catch (err) {
    if (err instanceof LimitError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }

  const invitation = await db.invitation.create({
    data: {
      email,
      organizationId: membership.organizationId,
      role,
      invitedById: session.user.id,
      expiresAt: addDays(new Date(), 7),
    },
    include: { organization: true, invitedBy: true },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

  // Enqueue email via background job (non-blocking)
  await enqueueJob(JOB_NAMES.SEND_INVITATION, {
    invitationId: invitation.id,
    organizationId: membership.organizationId,
    email,
    organizationName: invitation.organization.name,
    inviterName: invitation.invitedBy.name ?? "A teammate",
    inviteUrl,
  });

  return NextResponse.json({ token: invitation.token }, { status: 201 });
}
