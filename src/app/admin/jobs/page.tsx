import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminJobsPage() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }

  const [jobs, totalCount, failedCount] = await Promise.all([
    db.jobLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { organization: { select: { name: true, slug: true } } },
    }),
    db.jobLog.count(),
    db.jobLog.count({ where: { status: "failed" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Background jobs
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span>{totalCount} total</span>
          {failedCount > 0 && (
            <span className="font-medium text-rose-600">
              {failedCount} failed
            </span>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/60">
            <tr>
              <Th>Job</Th>
              <Th>Organization</Th>
              <Th>Status</Th>
              <Th>Error</Th>
              <Th>Completed</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {jobs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  No jobs recorded yet.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                  {job.jobName}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {job.organization ? (
                    <Link
                      href={`/dashboard/${job.organization.slug}`}
                      className="transition-colors hover:text-zinc-900 hover:underline"
                    >
                      {job.organization.name}
                    </Link>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-rose-600">
                  {job.error ?? <span className="text-zinc-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                  {job.completedAt
                    ? new Date(job.completedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
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
