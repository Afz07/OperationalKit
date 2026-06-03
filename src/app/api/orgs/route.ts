import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrganization } from "@/lib/org";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(2).max(64),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const org = await createOrganization(session.user.id, parsed.data.name);
  return NextResponse.json(org, { status: 201 });
}
