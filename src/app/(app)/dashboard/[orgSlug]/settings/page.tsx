import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import InviteForm from "@/components/dashboard/InviteForm";
import RemoveMemberButton from "@/components/dashboard/RemoveMemberButton";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: {
      organization: {
        include: {
          memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
          invitations: {
            where: { acceptedAt: null, expiresAt: { gt: new Date() } },
            include: { invitedBy: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) redirect("/dashboard");

  const { organization } = membership;
  const isAdmin =
    membership.role === MemberRole.ADMIN ||
    membership.role === MemberRole.OWNER;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage team members and workspace settings.
      </p>

      {/* Team members */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Team members</h2>
        <ul className="space-y-3 mb-6">
          {organization.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {m.user.image && (
                  <img
                    src={m.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-gray-500">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {m.role}
                </span>
                {isAdmin && m.userId !== session.user?.id && (
                  <RemoveMemberButton
                    membershipId={m.id}
                    orgSlug={orgSlug}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Pending invitations */}
        {organization.invitations.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
              Pending invitations
            </p>
            <ul className="space-y-2">
              {organization.invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">{inv.email}</span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                    pending
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Invite form */}
      {isAdmin && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Invite teammate</h2>
          <InviteForm orgSlug={orgSlug} />
        </div>
      )}
    </div>
  );
}
