import Link from "next/link";

const GITHUB_URL = "https://github.com/Afz07/OperationalKit";

type IconName = "shield" | "bolt" | "card" | "mail" | "code" | "rocket";

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: "shield",
    title: "Multi-tenant auth",
    desc: "Organizations, role-based access (Owner/Admin/Member), and invite links — pre-wired with NextAuth v5 and GitHub/Google OAuth.",
  },
  {
    icon: "bolt",
    title: "Background jobs",
    desc: "A pg-boss queue runs on your existing Postgres. No Redis, no extra infra — register a handler and enqueue jobs in two lines.",
  },
  {
    icon: "card",
    title: "Stripe billing",
    desc: "Checkout, subscription sync, and a webhook handler with signature verification and idempotent upserts. Just add your price IDs.",
  },
  {
    icon: "mail",
    title: "Transactional email",
    desc: "Resend integration with invitation and welcome templates ready to go. Emails are sent as background jobs — non-blocking.",
  },
  {
    icon: "code",
    title: "Type-safe stack",
    desc: "Next.js + TypeScript + Prisma + Tailwind, with zero type errors out of the box and full end-to-end type safety.",
  },
  {
    icon: "rocket",
    title: "One-click deploy",
    desc: "Railway deploy config included. Clone, set your env vars, deploy — production-ready in under an hour.",
  },
];

const STACK = [
  "Next.js 16",
  "TypeScript",
  "Prisma 7",
  "PostgreSQL",
  "NextAuth v5",
  "pg-boss",
  "Stripe",
  "Resend",
  "Tailwind CSS",
  "Zod",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          OperationalKit
        </span>
        <div className="flex items-center gap-5">
          <a
            href={GITHUB_URL}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            GitHub
          </a>
          <Link href="/auth/signin" className="btn-primary">
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Open source · Free to self-host · $29/mo managed
        </div>
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-900">
          Ship your SaaS in days, not weeks.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-zinc-500">
          A production-ready Next.js template with multi-tenant auth, background
          jobs, and Stripe billing pre-wired — so you can skip the boring setup
          and start building your actual product.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href={GITHUB_URL} className="btn-primary px-6 py-3">
            <GitHubMark />
            Star on GitHub
          </a>
          <Link href="/auth/signin" className="btn-secondary px-6 py-3">
            Live demo →
          </Link>
        </div>
      </section>

      {/* Stack badges */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="flex flex-wrap justify-center gap-2">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mx-auto mt-4 mb-12 max-w-xl text-center text-zinc-500">
            Spend your first week building features — not setting up auth and
            billing for the fifth time.
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card p-6 transition-shadow hover:shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <FeatureIcon name={f.icon} />
                </div>
                <h3 className="font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* vs competitors */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight text-zinc-900">
          Why not just use ___?
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-3 pr-6 text-left font-semibold text-zinc-900">
                  Feature
                </th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-900">
                  OperationalKit
                </th>
                <th className="px-4 py-3 text-center font-normal text-zinc-400">
                  T3 Stack
                </th>
                <th className="px-4 py-3 text-center font-normal text-zinc-400">
                  ShipFast
                </th>
                <th className="px-4 py-3 text-center font-normal text-zinc-400">
                  Wasp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {[
                ["Multi-tenant orgs + RBAC", true, false, false, true],
                ["Background jobs (no Redis)", true, false, false, false],
                ["Stripe webhooks + retry", true, false, true, false],
                ["Invite system", true, false, false, true],
                ["Pure Next.js (no DSL)", true, true, true, false],
                ["Free to self-host", true, true, false, true],
                ["Managed hosting option", true, false, false, true],
              ].map(([label, ...vals]) => (
                <tr key={label as string}>
                  <td className="py-3 pr-6 text-zinc-600">{label as string}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {v ? (
                        <span className="font-semibold text-emerald-500">✓</span>
                      ) : (
                        <span className="text-zinc-300">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-900 px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Stop setting up auth. Start shipping.
        </h2>
        <p className="mx-auto mt-4 mb-8 max-w-md text-zinc-400">
          Clone the repo, copy <code className="text-zinc-300">.env.example</code>,
          run migrate. Your SaaS foundation is ready.
        </p>
        <a
          href={GITHUB_URL}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          View on GitHub →
        </a>
        <p className="mt-6 text-xs text-zinc-500">
          MIT License · Free forever for self-hosted
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-400">
        OperationalKit — built for solo developers
      </footer>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function FeatureIcon({ name }: { name: IconName }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2.2 0-3s-2.2-.8-3 0Z" />
          <path d="M9 11a14 14 0 0 1 8-8c2 0 3 1 3 3a14 14 0 0 1-8 8l-3-3Z" />
          <path d="M13 7a1.5 1.5 0 1 0 2 2" />
        </svg>
      );
  }
}
