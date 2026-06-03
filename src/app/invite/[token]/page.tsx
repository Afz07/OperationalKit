import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const session = await auth();

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { organization: true, invitedBy: true },
  });

  if (!invitation || invitation.expiresAt < new Date() || invitation.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Invalid invitation</h1>
          <p className="text-gray-500 text-sm">
            This invitation link has expired or already been used.
          </p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/invite/${token}`);
  }

  // Accept invitation
  await db.$transaction([
    db.invitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    }),
    db.membership.upsert({
      where: {
        userId_organizationId: {
          userId: session.user.id!,
          organizationId: invitation.organizationId,
        },
      },
      update: {},
      create: {
        userId: session.user.id!,
        organizationId: invitation.organizationId,
        role: invitation.role as MemberRole,
      },
    }),
  ]);

  redirect(`/dashboard/${invitation.organization.slug}`);
}
