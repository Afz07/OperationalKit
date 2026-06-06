import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function JobsPage({ params }: Props) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
  });
  if (!membership) redirect("/dashboard");

  const jobs = await db.jobLog.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">
        Background jobs
      </h1>
      <p className="mb-8 text-sm text-zinc-500">Recent job execution history.</p>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="Total jobs" value={stats.total} />
        <StatCard
          label="Completed"
          value={stats.completed}
          color="text-emerald-600"
        />
        <StatCard label="Failed" value={stats.failed} color="text-rose-500" />
      </div>

      {/* Job log table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/60">
            <tr>
              <Th>Job</Th>
              <Th>Status</Th>
              <Th>Completed</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm text-zinc-400"
                >
                  No jobs yet. They&apos;ll appear here as they run.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                  {job.jobName}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {job.completedAt
                    ? new Date(job.completedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(job.createdAt).toLocaleString()}
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
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
      {children}
    </th>
  );
}

function StatCard({
  label,
  value,
  color = "text-zinc-900",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
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
