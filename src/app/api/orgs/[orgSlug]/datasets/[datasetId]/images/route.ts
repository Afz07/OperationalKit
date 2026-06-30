import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ orgSlug: string; datasetId: string }>;
}

async function getDataset(userId: string, orgSlug: string, datasetId: string) {
  const membership = await db.membership.findFirst({
    where: { userId, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership) return null;
  return db.dataset.findFirst({
    where: { id: datasetId, organizationId: membership.organizationId },
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dataset = await getDataset(session.user.id, orgSlug, datasetId);
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const images = await db.datasetImage.findMany({
    where: { datasetId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      width: true,
      height: true,
      createdAt: true,
      _count: { select: { annotations: true } },
    },
  });

  return NextResponse.json(images);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dataset = await getDataset(session.user.id, orgSlug, datasetId);
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (files.length === 0)
    return NextResponse.json({ error: "No images provided" }, { status: 422 });

  const created = await Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return db.datasetImage.create({
        data: {
          datasetId,
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          imageData: base64,
        },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          width: true,
          height: true,
          createdAt: true,
        },
      });
    })
  );

  return NextResponse.json(created, { status: 201 });
}
