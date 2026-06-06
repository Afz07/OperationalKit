"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar nav item that highlights itself when active. Split into a client
 * component so the rest of the sidebar can stay a server component.
 */
export default function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}
