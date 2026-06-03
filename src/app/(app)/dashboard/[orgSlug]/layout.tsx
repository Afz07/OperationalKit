import Sidebar from "@/components/dashboard/Sidebar";

interface Props {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: Props) {
  const { orgSlug } = await params;

  return (
    <div className="flex w-full">
      <Sidebar orgSlug={orgSlug} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
