import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrganization } from "@/lib/org";
import { assertCanCreateWorkspace, LimitError } from "@/lib/limits";
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

  try {
    await assertCanCreateWorkspace(session.user.id);
  } catch (err) {
    if (err instanceof LimitError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }

  const org = await createOrganization(session.user.id, parsed.data.name);
  return NextResponse.json(org, { status: 201 });
}
