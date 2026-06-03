import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

interface Props {
  orgSlug: string;
}

export default async function Sidebar({ orgSlug }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  const NAV = [
    { href: `/dashboard/${orgSlug}`, label: "Overview" },
    { href: `/dashboard/${orgSlug}/jobs`, label: "Jobs" },
    { href: `/dashboard/${orgSlug}/settings`, label: "Settings" },
    { href: `/dashboard/${orgSlug}/billing`, label: "Billing" },
  ];

  return (
    <aside className="w-56 min-h-screen border-r bg-gray-50 flex flex-col">
      <div className="p-4 border-b">
        <p className="font-semibold text-sm truncate">
          {memberships.find((m) => m.organization.slug === orgSlug)
            ?.organization.name ?? orgSlug}
        </p>
        {/* Org switcher */}
        {memberships.length > 1 && (
          <div className="mt-2">
            {memberships
              .filter((m) => m.organization.slug !== orgSlug)
              .map((m) => (
                <Link
                  key={m.id}
                  href={`/dashboard/${m.organization.slug}`}
                  className="block text-xs text-gray-500 hover:text-black py-1 truncate"
                >
                  → {m.organization.name}
                </Link>
              ))}
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-white hover:text-black transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <div className="flex items-center gap-2 px-3 py-2">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-xs text-gray-500 truncate">
            {session.user.email}
          </span>
        </div>
        <form
          action={async () => {
            "use server";
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-black transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
