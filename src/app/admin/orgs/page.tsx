import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export default async function AdminOrgsPage() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true } },
      subscriptions: { where: { status: "active" } },
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-black">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold mt-1">Organizations</h1>
        </div>
        <span className="text-sm text-gray-500">{orgs.length} total</span>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Members</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgs.map((org) => (
              <tr key={org.id}>
                <td className="px-4 py-3 font-medium">{org.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {org.slug}
                </td>
                <td className="px-4 py-3 text-center">{org._count.memberships}</td>
                <td className="px-4 py-3 text-center">
                  {org.subscriptions.length > 0 ? (
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      Pro
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
