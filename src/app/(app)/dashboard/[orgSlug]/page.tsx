import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{organization.name}</h1>
        <p className="text-gray-500 text-sm">/{organization.slug}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Team members"
          value={organization.memberships.length}
        />
        <StatCard
          label="Plan"
          value={isActive ? "Pro" : "Free"}
          highlight={isActive}
        />
        <StatCard label="Your role" value={membership.role} />
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">Team</h2>
        <ul className="space-y-3">
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
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {!isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-1">Upgrade to Pro</h3>
          <p className="text-sm text-amber-700 mb-3">
            Unlock unlimited members, jobs, and priority support.
          </p>
          <a
            href={`/dashboard/${orgSlug}/billing`}
            className="inline-block bg-amber-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            View Plans →
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
    <div className="bg-white rounded-xl border p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${highlight ? "text-green-600" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
