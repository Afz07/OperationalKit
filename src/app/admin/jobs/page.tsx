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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-black">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold mt-1">Background Jobs</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{totalCount} total</span>
          {failedCount > 0 && (
            <span className="text-red-600 font-medium">{failedCount} failed</span>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Organization</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Error</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Completed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No jobs recorded yet.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">
                  {job.jobName}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {job.organization ? (
                    <Link
                      href={`/dashboard/${job.organization.slug}`}
                      className="hover:text-black hover:underline"
                    >
                      {job.organization.name}
                    </Link>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-red-600 max-w-xs truncate">
                  {job.error ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {job.completedAt
                    ? new Date(job.completedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-600",
    pending: "bg-yellow-50 text-yellow-700",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
