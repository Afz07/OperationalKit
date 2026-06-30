import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface Ctx {
  params: Promise<{ imageId: string }>;
}

async function getImageForUser(userId: string, imageId: string) {
  return db.datasetImage.findFirst({
    where: {
      id: imageId,
      dataset: {
        organization: {
          memberships: { some: { userId } },
        },
      },
    },
  });
}

const annotationSchema = z.object({
  labelClassId: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export async function GET(req: NextRequest, { params }: Ctx) {
  const { imageId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const image = await getImageForUser(session.user.id, imageId);
  if (!image)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const annotations = await db.annotation.findMany({
    where: { imageId },
    orderBy: { createdAt: "asc" },
    include: { labelClass: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(annotations);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { imageId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const image = await getImageForUser(session.user.id, imageId);
  if (!image)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = annotationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const labelClass = await db.labelClass.findFirst({
    where: { id: parsed.data.labelClassId, dataset: { images: { some: { id: imageId } } } },
  });
  if (!labelClass)
    return NextResponse.json({ error: "Label class not found" }, { status: 404 });

  const annotation = await db.annotation.create({
    data: { imageId, ...parsed.data },
    include: { labelClass: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(annotation, { status: 201 });
}
