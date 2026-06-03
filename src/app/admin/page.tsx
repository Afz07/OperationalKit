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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-gray-500 text-sm">Platform overview</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/orgs"
            className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            All orgs →
          </Link>
          <Link
            href="/admin/jobs"
            className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            All jobs →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Organizations" value={orgCount} />
        <StatCard label="Users" value={userCount} />
        <StatCard label="Active subscriptions" value={subCount} highlight />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold">Recent job activity</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-2 font-medium text-gray-500">Job</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentJobs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  No jobs yet
                </td>
              </tr>
            )}
            {recentJobs.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-2 font-mono text-xs">{j.jobName}</td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      j.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : j.status === "failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {j.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">
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
    <div className="bg-white border rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-green-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}
