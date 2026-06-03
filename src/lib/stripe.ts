import Stripe from "stripe";

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    price: 0,
    features: ["1 workspace", "3 team members", "5 background jobs"],
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    price: 29,
    features: [
      "Unlimited workspaces",
      "Unlimited team members",
      "Unlimited background jobs",
      "Priority support",
    ],
  },
} as const;

export type Plan = keyof typeof PLANS;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
}

// Named export for convenience in routes
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get subscriptions() { return getStripe().subscriptions; },
  webhooks: {
    constructEvent: (...args: Parameters<Stripe["webhooks"]["constructEvent"]>) =>
      getStripe().webhooks.constructEvent(...args),
  },
};
