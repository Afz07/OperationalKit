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

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, organizationId: membership.organizationId },
  });
  return dataset;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dataset = await getDataset(session.user.id, orgSlug, datasetId);
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(dataset);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dataset = await getDataset(session.user.id, orgSlug, datasetId);
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.dataset.delete({ where: { id: datasetId } });
  return new NextResponse(null, { status: 204 });
}
