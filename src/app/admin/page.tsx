import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }

  const [orgCount, userCount, subCount, recentJobs] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.subscription.count({ where: { status: "active" } }),
    db.jobLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Admin</h1>
          <p className="text-sm text-zinc-500">Platform overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/orgs" className="btn-secondary">
            All orgs →
          </Link>
          <Link href="/admin/jobs" className="btn-secondary">
            All jobs →
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="Organizations" value={orgCount} />
        <StatCard label="Users" value={userCount} />
        <StatCard label="Active subscriptions" value={subCount} highlight />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-zinc-200 bg-zinc-50/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Recent job activity
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100">
            <tr>
              <Th>Job</Th>
              <Th>Status</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {recentJobs.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  No jobs yet
                </td>
              </tr>
            )}
            {recentJobs.map((j) => (
              <tr key={j.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-700">
                  {j.jobName}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={j.status} />
                </td>
                <td className="px-4 py-2.5 text-zinc-500">
                  {new Date(j.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
      {children}
    </th>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-600",
    pending: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`badge ${styles[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {status}
    </span>
  );
}
