import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ orgSlug: string; datasetId: string; imageId: string }>;
}

async function getImage(
  userId: string,
  orgSlug: string,
  datasetId: string,
  imageId: string
) {
  const membership = await db.membership.findFirst({
    where: { userId, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership) return null;

  return db.datasetImage.findFirst({
    where: {
      id: imageId,
      datasetId,
      dataset: { organizationId: membership.organizationId },
    },
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId, imageId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const image = await getImage(session.user.id, orgSlug, datasetId, imageId);
  if (!image)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: image.id,
    filename: image.filename,
    mimeType: image.mimeType,
    imageData: image.imageData,
    width: image.width,
    height: image.height,
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId, imageId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const image = await getImage(session.user.id, orgSlug, datasetId, imageId);
  if (!image)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.datasetImage.delete({ where: { id: imageId } });
  return new NextResponse(null, { status: 204 });
}
