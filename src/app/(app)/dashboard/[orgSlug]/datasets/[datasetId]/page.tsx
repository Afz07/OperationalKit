import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/datasets/ImageUploader";

interface Props {
  params: Promise<{ orgSlug: string; datasetId: string }>;
}

export default async function DatasetDetailPage({ params }: Props) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership) redirect("/dashboard");

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, organizationId: membership.organizationId },
    include: {
      labelClasses: { orderBy: { createdAt: "asc" } },
      _count: { select: { images: true } },
    },
  });
  if (!dataset) redirect(`/dashboard/${orgSlug}/datasets`);

  const images = await db.datasetImage.findMany({
    where: { datasetId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      imageData: true,
      createdAt: true,
      _count: { select: { annotations: true } },
    },
  });

  const annotated = images.filter((i) => i._count.annotations > 0).length;

  return (
    <div className="mx-auto max-w-6xl p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${orgSlug}/datasets`}
          className="mb-2 inline-block text-sm text-zinc-400 hover:text-zinc-700"
        >
          ← Datasets
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{dataset.name}</h1>
        {dataset.description && (
          <p className="mt-0.5 text-sm text-zinc-500">{dataset.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Total images
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{images.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Labeled
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{annotated}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Classes
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {dataset.labelClasses.length}
          </p>
        </div>
      </div>

      {/* Label classes */}
      {dataset.labelClasses.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {dataset.labelClasses.map((cls) => (
            <span
              key={cls.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-0.5 text-xs font-medium text-zinc-700"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: cls.color }}
              />
              {cls.name}
            </span>
          ))}
        </div>
      )}

      {/* Upload */}
      <div className="mb-8">
        <ImageUploader orgSlug={orgSlug} datasetId={datasetId} />
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            Images{" "}
            <span className="font-normal text-zinc-400">({images.length})</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((img) => (
              <Link
                key={img.id}
                href={`/dashboard/${orgSlug}/datasets/${datasetId}/label/${img.id}`}
                className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 aspect-square hover:border-indigo-300 hover:shadow-md transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${img.mimeType};base64,${img.imageData}`}
                  alt={img.filename}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate text-xs text-white">{img.filename}</p>
                  <p className="text-xs text-zinc-300">
                    {img._count.annotations} annotation
                    {img._count.annotations !== 1 ? "s" : ""}
                  </p>
                </div>
                {img._count.annotations > 0 && (
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center">
                    {img._count.annotations > 9 ? "9+" : img._count.annotations}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
