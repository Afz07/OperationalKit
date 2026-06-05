import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/org";
import { isStripeConfigured } from "@/lib/env";
import { MemberRole } from "@prisma/client";
import { z } from "zod";

const checkoutSchema = z.object({
  orgSlug: z.string(),
  plan: z.enum(["PRO"]),
});

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured" },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { orgSlug, plan } = parsed.data;

  const membership = await requireOrgRole(orgSlug, MemberRole.ADMIN).catch(() => null);
  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 }
    );
  }

  const priceId = PLANS[plan].priceId;

  const org = await db.organization.findUnique({
    where: { slug: orgSlug },
    include: { subscriptions: true },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Reuse existing Stripe customer or create new one
  let customerId = org.subscriptions[0]?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: org.name,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${orgSlug}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${orgSlug}/billing`,
    subscription_data: {
      metadata: { organizationId: org.id },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
