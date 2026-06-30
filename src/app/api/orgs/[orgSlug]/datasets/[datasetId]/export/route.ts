import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ orgSlug: string; datasetId: string }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { orgSlug, datasetId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: { organization: true },
  });
  if (!membership)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, organizationId: membership.organizationId },
    include: {
      labelClasses: { orderBy: { createdAt: "asc" } },
      images: {
        orderBy: { createdAt: "asc" },
        include: {
          annotations: { include: { labelClass: true } },
        },
      },
    },
  });
  if (!dataset)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") ?? "coco";

  if (format === "yolo") {
    const classNames = dataset.labelClasses.map((c) => c.name);
    const classIndex = Object.fromEntries(
      dataset.labelClasses.map((c, i) => [c.id, i])
    );

    const files: Record<string, string> = {
      "classes.txt": classNames.join("\n"),
    };

    for (const img of dataset.images) {
      const lines = img.annotations.map((ann) => {
        const idx = classIndex[ann.labelClassId] ?? 0;
        const cx = ann.x + ann.width / 2;
        const cy = ann.y + ann.height / 2;
        return `${idx} ${cx.toFixed(6)} ${cy.toFixed(6)} ${ann.width.toFixed(6)} ${ann.height.toFixed(6)}`;
      });
      const txtName = img.filename.replace(/\.[^.]+$/, ".txt");
      files[txtName] = lines.join("\n");
    }

    return NextResponse.json({ format: "yolo", files });
  }

  // COCO JSON
  const categories = dataset.labelClasses.map((c, i) => ({
    id: i + 1,
    name: c.name,
    supercategory: "object",
  }));
  const catIndex = Object.fromEntries(
    dataset.labelClasses.map((c, i) => [c.id, i + 1])
  );

  const images = dataset.images.map((img, i) => ({
    id: i + 1,
    file_name: img.filename,
    width: img.width ?? 0,
    height: img.height ?? 0,
  }));
  const imgIndex = Object.fromEntries(dataset.images.map((img, i) => [img.id, i + 1]));

  let annId = 1;
  const annotations = dataset.images.flatMap((img) =>
    img.annotations.map((ann) => {
      const w = img.width ?? 1;
      const h = img.height ?? 1;
      const x = ann.x * w;
      const y = ann.y * h;
      const bw = ann.width * w;
      const bh = ann.height * h;
      return {
        id: annId++,
        image_id: imgIndex[img.id],
        category_id: catIndex[ann.labelClassId],
        bbox: [
          parseFloat(x.toFixed(2)),
          parseFloat(y.toFixed(2)),
          parseFloat(bw.toFixed(2)),
          parseFloat(bh.toFixed(2)),
        ],
        area: parseFloat((bw * bh).toFixed(2)),
        iscrowd: 0,
      };
    })
  );

  const coco = {
    info: { description: dataset.name, version: "1.0", year: new Date().getFullYear() },
    categories,
    images,
    annotations,
  };

  return NextResponse.json({ format: "coco", data: coco });
}
