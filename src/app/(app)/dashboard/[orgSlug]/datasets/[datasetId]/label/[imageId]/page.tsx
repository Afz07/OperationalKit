import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import LabelingInterface from "@/components/labeling/LabelingInterface";

interface Props {
  params: Promise<{ orgSlug: string; datasetId: string; imageId: string }>;
}

export default async function LabelPage({ params }: Props) {
  const { orgSlug, datasetId, imageId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership) redirect("/dashboard");

  const image = await db.datasetImage.findFirst({
    where: {
      id: imageId,
      datasetId,
      dataset: { organizationId: membership.organizationId },
    },
    include: {
      annotations: {
        include: { labelClass: { select: { id: true, name: true, color: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!image) redirect(`/dashboard/${orgSlug}/datasets/${datasetId}`);

  const labelClasses = await db.labelClass.findMany({
    where: { datasetId },
    orderBy: { createdAt: "asc" },
  });

  const allImageIds = await db.datasetImage.findMany({
    where: { datasetId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const currentIndex = allImageIds.findIndex((i) => i.id === imageId);
  const prevImageId = currentIndex > 0 ? allImageIds[currentIndex - 1].id : undefined;
  const nextImageId =
    currentIndex < allImageIds.length - 1 ? allImageIds[currentIndex + 1].id : undefined;

  return (
    <LabelingInterface
      imageId={imageId}
      imageData={image.imageData}
      mimeType={image.mimeType}
      filename={image.filename}
      initialAnnotations={image.annotations}
      initialLabelClasses={labelClasses}
      prevImageId={prevImageId}
      nextImageId={nextImageId}
      orgSlug={orgSlug}
      datasetId={datasetId}
    />
  );
}
