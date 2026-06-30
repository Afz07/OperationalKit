import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import NewDatasetForm from "@/components/datasets/NewDatasetForm";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function DatasetsPage({ params }: Props) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership) redirect("/dashboard");

  const datasets = await db.dataset.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { images: true, labelClasses: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Datasets</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Manage and label your computer vision datasets.
          </p>
        </div>
        <NewDatasetForm orgSlug={orgSlug} />
      </div>

      {datasets.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="mb-4 text-4xl">🏷️</div>
          <h3 className="text-base font-semibold text-zinc-900">No datasets yet</h3>
          <p className="mt-1 mb-6 text-sm text-zinc-500">
            Create a dataset to start uploading and labeling images.
          </p>
          <NewDatasetForm orgSlug={orgSlug} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((ds) => (
            <Link
              key={ds.id}
              href={`/dashboard/${orgSlug}/datasets/${ds.id}`}
              className="card block p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xl font-bold">
                {ds.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-zinc-900 truncate">{ds.name}</h3>
              {ds.description && (
                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{ds.description}</p>
              )}
              <div className="mt-4 flex gap-4 text-xs text-zinc-400">
                <span>
                  <strong className="text-zinc-700">{ds._count.images}</strong> images
                </span>
                <span>
                  <strong className="text-zinc-700">{ds._count.labelClasses}</strong> classes
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Created {new Date(ds.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
