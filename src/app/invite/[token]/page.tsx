import Link from "next/link";
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="card w-full max-w-sm p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">
            Invalid invitation
          </h1>
          <p className="mb-6 text-sm text-zinc-500">
            This invitation link has expired or has already been used.
          </p>
          <Link href="/" className="btn-secondary">
            Go home
          </Link>
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
