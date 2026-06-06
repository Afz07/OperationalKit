import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/env";
import UpgradeButton from "@/components/dashboard/UpgradeButton";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { success } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { slug: orgSlug } },
    include: { organization: { include: { subscriptions: true } } },
  });
  if (!membership) redirect("/dashboard");

  const sub = membership.organization.subscriptions[0];
  const isActive = sub?.status === "active";
  const periodEnd = sub?.stripeCurrentPeriodEnd;
  const stripeConfigured = isStripeConfigured();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900">Billing</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Manage your subscription and billing details.
      </p>

      {success && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Subscription activated — welcome to Pro! 🎉
        </div>
      )}

      <div className="card mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Current plan</h2>
          <span
            className={`badge ${
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {isActive ? "Active" : "Free"}
          </span>
        </div>

        <p className="text-3xl font-semibold text-zinc-900">
          {isActive ? "$29" : "$0"}
          <span className="text-base font-normal text-zinc-400">/month</span>
        </p>

        {isActive && periodEnd && (
          <p className="mt-1 text-sm text-zinc-500">
            Renews {periodEnd.toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
        )}

        <ul className="mt-5 space-y-2.5">
          {PLANS[isActive ? "PRO" : "FREE"].features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2.5 text-sm text-zinc-600"
            >
              <CheckIcon />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {!stripeConfigured ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-2 font-semibold text-zinc-900">
            Billing not configured
          </h2>
          <p className="text-sm text-zinc-500">
            Set <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs">STRIPE_SECRET_KEY</code> and{" "}
            <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs">STRIPE_PRO_PRICE_ID</code> to
            enable upgrades. See <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs">.env.example</code>.
          </p>
        </div>
      ) : !isActive ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-2 font-semibold text-zinc-900">
            Upgrade to Pro — $29/month
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Unlimited workspaces, team members, and background jobs.
          </p>
          <UpgradeButton orgSlug={orgSlug} />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="mb-2 font-semibold text-zinc-900">
            Manage subscription
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Update your payment method or cancel anytime from the Stripe portal.
          </p>
          <a href={`/api/stripe/portal?org=${orgSlug}`} className="btn-secondary">
            Open billing portal →
          </a>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-emerald-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.792-6.886a1 1 0 0 1 1.414-.006Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
