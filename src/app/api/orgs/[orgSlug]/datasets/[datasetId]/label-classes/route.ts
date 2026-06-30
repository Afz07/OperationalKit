import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

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

const classSchema = z.object({
  name: z.string().min(1).max(64),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
});

export async function GET(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dataset = await getDataset(session.user.id, orgSlug, datasetId);
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const classes = await db.labelClass.findMany({
    where: { datasetId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dataset = await getDataset(session.user.id, orgSlug, datasetId);
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = classSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const cls = await db.labelClass.create({
    data: { datasetId, name: parsed.data.name, color: parsed.data.color },
  });

  return NextResponse.json(cls, { status: 201 });
}
