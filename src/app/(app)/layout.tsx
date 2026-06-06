import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return <div className="flex min-h-screen bg-zinc-50">{children}</div>;
}
