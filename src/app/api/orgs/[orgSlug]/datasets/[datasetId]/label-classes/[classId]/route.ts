import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ orgSlug: string; datasetId: string; classId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId, classId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cls = await db.labelClass.findFirst({
    where: {
      id: classId,
      datasetId,
      dataset: { organizationId: membership.organizationId },
    },
  });
  if (!cls)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.labelClass.delete({ where: { id: classId } });
  return new NextResponse(null, { status: 204 });
}
