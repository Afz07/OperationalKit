import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Avatar from "@/components/dashboard/Avatar";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgDashboardPage({ params }: Props) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
    },
    include: {
      organization: {
        include: {
          memberships: { include: { user: true } },
          subscriptions: true,
        },
      },
    },
  });

  if (!membership) redirect("/dashboard");

  const { organization } = membership;
  const sub = organization.subscriptions[0];
  const isActive = sub?.status === "active";

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {organization.name}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">/{organization.slug}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Team members"
          value={organization.memberships.length}
        />
        <StatCard
          label="Plan"
          value={isActive ? "Pro" : "Free"}
          highlight={isActive}
        />
        <StatCard label="Your role" value={titleCase(membership.role)} />
      </div>

      <div className="card mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Team</h2>
        <ul className="divide-y divide-zinc-100">
          {organization.memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
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
              <RoleBadge role={m.role} />
            </li>
          ))}
        </ul>
      </div>

      {!isActive && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h3 className="font-semibold text-zinc-900">Upgrade to Pro</h3>
          <p className="mt-1 mb-4 text-sm text-zinc-500">
            Unlock unlimited members, jobs, and priority support.
          </p>
          <a href={`/dashboard/${orgSlug}/billing`} className="btn-primary">
            View plans →
          </a>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          highlight ? "text-emerald-600" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: "bg-zinc-900 text-white",
    ADMIN: "bg-indigo-50 text-indigo-700",
    MEMBER: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span className={`badge ${styles[role] ?? styles.MEMBER}`}>
      {titleCase(role)}
    </span>
  );
}

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
