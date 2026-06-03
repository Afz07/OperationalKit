import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/org";
import { MemberRole } from "@prisma/client";

interface Params {
  params: Promise<{ orgSlug: string; membershipId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { orgSlug, membershipId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireOrgRole(orgSlug, MemberRole.ADMIN).catch(() => {
    throw new Error("Forbidden");
  });

  // Cannot remove yourself via this endpoint; must use /leave
  const target = await db.membership.findUnique({ where: { id: membershipId } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "Use /leave to remove yourself" }, { status: 400 });
  }

  await db.membership.delete({ where: { id: membershipId } });
  return new NextResponse(null, { status: 204 });
}
