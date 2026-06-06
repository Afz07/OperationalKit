import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Avatar from "@/components/dashboard/Avatar";
import NavLink from "@/components/dashboard/NavLink";

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

  const current = memberships.find((m) => m.organization.slug === orgSlug);

  const NAV = [
    { href: `/dashboard/${orgSlug}`, label: "Overview" },
    { href: `/dashboard/${orgSlug}/jobs`, label: "Jobs" },
    { href: `/dashboard/${orgSlug}/settings`, label: "Settings" },
    { href: `/dashboard/${orgSlug}/billing`, label: "Billing" },
  ];

  return (
    <aside className="flex min-h-screen w-60 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 p-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={current?.organization.name ?? orgSlug} size={32} />
          <p className="truncate text-sm font-semibold text-zinc-900">
            {current?.organization.name ?? orgSlug}
          </p>
        </div>

        {/* Org switcher */}
        {memberships.length > 1 && (
          <div className="mt-3 space-y-0.5">
            {memberships
              .filter((m) => m.organization.slug !== orgSlug)
              .map((m) => (
                <Link
                  key={m.id}
                  href={`/dashboard/${m.organization.slug}`}
                  className="block truncate rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                >
                  ↳ {m.organization.name}
                </Link>
              ))}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label }) => (
          <NavLink key={href} href={href} label={label} />
        ))}
      </nav>

      <div className="border-t border-zinc-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar
            src={session.user.image}
            name={session.user.name ?? session.user.email ?? "?"}
            size={28}
          />
          <span className="truncate text-xs text-zinc-500">
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
          <button className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-900">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
