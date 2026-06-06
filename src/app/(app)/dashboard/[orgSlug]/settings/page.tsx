import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import Avatar from "@/components/dashboard/Avatar";
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
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Settings</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Manage team members and workspace settings.
      </p>

      {/* Team members */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">
          Team members
        </h2>
        <ul className="divide-y divide-zinc-100">
          {organization.memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-3 first:pt-0"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={m.user.image}
                  name={m.user.name ?? m.user.email ?? "?"}
                  size={36}
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {m.user.name ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-zinc-500">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RoleBadge role={m.role} />
                {isAdmin && m.userId !== session.user?.id && (
                  <RemoveMemberButton membershipId={m.id} orgSlug={orgSlug} />
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Pending invitations */}
        {organization.invitations.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Pending invitations
            </p>
            <ul className="space-y-2">
              {organization.invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-600">{inv.email}</span>
                  <span className="badge bg-amber-50 text-amber-700">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Invite form */}
      {isAdmin && (
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            Invite teammate
          </h2>
          <InviteForm orgSlug={orgSlug} />
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: "bg-zinc-900 text-white",
    ADMIN: "bg-indigo-50 text-indigo-700",
    MEMBER: "bg-zinc-100 text-zinc-600",
  };
  const label = role.charAt(0) + role.slice(1).toLowerCase();
  return <span className={`badge ${styles[role] ?? styles.MEMBER}`}>{label}</span>;
}
