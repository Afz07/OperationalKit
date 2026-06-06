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
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Organizations
          </h1>
        </div>
        <span className="text-sm text-zinc-500">{orgs.length} total</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50/60">
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th center>Members</Th>
              <Th center>Plan</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orgs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  No organizations yet
                </td>
              </tr>
            )}
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {org.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {org.slug}
                </td>
                <td className="px-4 py-3 text-center text-zinc-600">
                  {org._count.memberships}
                </td>
                <td className="px-4 py-3 text-center">
                  {org.subscriptions.length > 0 ? (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      Pro
                    </span>
                  ) : (
                    <span className="badge bg-zinc-100 text-zinc-500">Free</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
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

function Th({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400 ${
        center ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
