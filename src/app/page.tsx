import Link from "next/link";

const FEATURES = [
  {
    icon: "🔐",
    title: "Multi-tenant Auth",
    desc: "Organizations, role-based access (Owner/Admin/Member), invite links — pre-wired with NextAuth v5 and GitHub/Google OAuth.",
  },
  {
    icon: "⚡",
    title: "Background Jobs",
    desc: "pg-boss job queue runs on your existing Postgres. No Redis, no extra infra. Register handlers and enqueue jobs in two lines.",
  },
  {
    icon: "💳",
    title: "Stripe Billing",
    desc: "Checkout session, subscription sync, and webhook handler with signature verification and idempotent upserts. Just add your price IDs.",
  },
  {
    icon: "✉️",
    title: "Transactional Email",
    desc: "Resend integration with invitation and welcome templates ready to go. Emails are sent as background jobs — non-blocking.",
  },
  {
    icon: "🏗️",
    title: "Type-safe Stack",
    desc: "Next.js 15 + TypeScript + Prisma + Tailwind. Zero TypeScript errors out of the box. Full end-to-end type safety.",
  },
  {
    icon: "🚀",
    title: "One-click Deploy",
    desc: "Railway and Vercel deploy buttons in the README. Clone, set env vars, deploy. Production-ready in under an hour.",
  },
];

const STACK = [
  "Next.js 15",
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
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-bold text-lg tracking-tight">OperationalKit</span>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Afz07/my-first-project"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/auth/signin"
            className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Open source · Free to self-host · $29/mo managed
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-6">
          Ship your SaaS in days,
          <br />
          not weeks.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          OperationalKit is a production-ready Next.js template with multi-tenant
          auth, background jobs, and Stripe billing pre-wired — so you can skip
          the boring setup and start building your actual product.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://github.com/Afz07/my-first-project"
            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Star on GitHub
          </a>
          <Link
            href="/auth/signin"
            className="border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Live demo →
          </Link>
        </div>
      </section>

      {/* Stack badges */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-2">
          {STACK.map((s) => (
            <span
              key={s}
              className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Spend the first week building features, not setting up auth and
            billing for the fifth time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* vs competitors */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why not just use ___?
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 pr-6 font-semibold">Feature</th>
                <th className="text-center py-3 px-4 font-semibold">OperationalKit</th>
                <th className="text-center py-3 px-4 text-gray-400 font-normal">T3 Stack</th>
                <th className="text-center py-3 px-4 text-gray-400 font-normal">ShipFast</th>
                <th className="text-center py-3 px-4 text-gray-400 font-normal">Wasp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                  <td className="py-3 pr-6 text-gray-700">{label as string}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="text-center py-3 px-4">
                      {v ? (
                        <span className="text-green-500 font-bold">✓</span>
                      ) : (
                        <span className="text-gray-300">–</span>
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
      <section className="bg-black text-white py-20 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">
          Stop setting up auth. Start shipping.
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Clone the repo, copy .env.example, run migrate. Your SaaS foundation
          is ready.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://github.com/Afz07/my-first-project"
            className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            View on GitHub →
          </a>
        </div>
        <p className="text-gray-600 text-xs mt-6">
          MIT License · Free forever for self-hosted
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        OperationalKit — Built for solo developers
      </footer>
    </div>
  );
}
