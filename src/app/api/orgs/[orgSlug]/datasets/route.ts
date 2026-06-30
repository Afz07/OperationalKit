import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface Ctx {
  params: Promise<{ orgSlug: string }>;
}

async function getMembership(userId: string, orgSlug: string) {
  return db.membership.findFirst({
    where: { userId, organization: { slug: orgSlug } },
    include: { organization: true },
  });
}

const createDatasetSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembership(session.user.id, orgSlug);
  if (!membership)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const datasets = await db.dataset.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { images: true, labelClasses: true } },
    },
  });

  return NextResponse.json(datasets);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { orgSlug } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembership(session.user.id, orgSlug);
  if (!membership)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createDatasetSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const dataset = await db.dataset.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      organizationId: membership.organizationId,
    },
  });

  return NextResponse.json(dataset, { status: 201 });
}
