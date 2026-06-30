import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ imageId: string; annotationId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { imageId, annotationId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const annotation = await db.annotation.findFirst({
    where: {
      id: annotationId,
      imageId,
      image: {
        dataset: {
          organization: { memberships: { some: { userId: session.user.id } } },
        },
      },
    },
  });
  if (!annotation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.annotation.delete({ where: { id: annotationId } });
  return new NextResponse(null, { status: 204 });
}
