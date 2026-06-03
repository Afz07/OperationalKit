import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe";
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

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Billing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage your subscription and billing details.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6 text-sm">
          Subscription activated! Welcome to Pro.
        </div>
      )}

      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Current plan</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isActive ? "Active" : "Free"}
          </span>
        </div>

        <p className="text-3xl font-bold mb-1">
          {isActive ? "$29" : "$0"}
          <span className="text-base font-normal text-gray-400">/month</span>
        </p>

        {isActive && periodEnd && (
          <p className="text-sm text-gray-500 mt-1">
            Renews {periodEnd.toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {PLANS[isActive ? "PRO" : "FREE"].features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-green-500">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {!isActive ? (
        <div className="bg-gray-50 border rounded-xl p-6">
          <h2 className="font-semibold mb-2">Upgrade to Pro — $29/month</h2>
          <p className="text-sm text-gray-500 mb-4">
            Unlimited workspaces, team members, and background jobs.
          </p>
          <UpgradeButton orgSlug={orgSlug} />
        </div>
      ) : (
        <div className="bg-gray-50 border rounded-xl p-6">
          <h2 className="font-semibold mb-2">Manage subscription</h2>
          <p className="text-sm text-gray-500 mb-4">
            Update your payment method or cancel anytime from the Stripe portal.
          </p>
          <a
            href={`/api/stripe/portal?org=${orgSlug}`}
            className="inline-block border border-gray-300 text-sm px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Open billing portal →
          </a>
        </div>
      )}
    </div>
  );
}
