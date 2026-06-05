import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/env";

export async function GET(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  const orgSlug = req.nextUrl.searchParams.get("org");

  const sub = await db.subscription.findFirst({
    where: orgSlug
      ? { organization: { slug: orgSlug } }
      : { organization: { memberships: { some: { userId: session.user.id } } } },
    orderBy: { createdAt: "desc" },
  });

  if (!sub?.stripeCustomerId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: orgSlug
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${orgSlug}/billing`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.redirect(portalSession.url);
}
