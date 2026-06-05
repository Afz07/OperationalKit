# OperationalKit

**The production-ready Next.js SaaS foundation for solo developers.**

Most SaaS boilerplates give you a pretty UI and leave you to wire everything else yourself. OperationalKit is different — auth, background jobs, billing, and email are fully connected on day one.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)

---

## The problem

Every solo developer building a SaaS spends the first 1–2 weeks on the same things:

- Multi-tenant auth with roles and invite links
- A background job queue (pick Redis? Celery? roll your own?)
- Stripe checkout + webhook handler that doesn't lose events
- Email with proper templates

None of this is the product. It's infrastructure. OperationalKit ships it pre-wired.

---

## What's included

| Feature | What you get |
|---------|-------------|
| **Multi-tenant auth** | Organizations, RBAC (Owner / Admin / Member), invite links, org switching, GitHub + Google OAuth |
| **Background jobs** | pg-boss queue on top of Postgres — no Redis, no separate service |
| **Stripe billing** | Checkout sessions, webhook handler with signature verification, subscription sync, billing portal |
| **Email** | Resend integration with invitation and welcome templates |
| **Admin panel** | `/admin` — org list, member counts, subscription status, protected by `ADMIN_EMAILS` env |
| **Type-safe stack** | Next.js 16 + TypeScript + Prisma 7 + Zod — zero TS errors out of the box |

---

## Stack

```
Next.js 16 (App Router)     →  framework
NextAuth v5                 →  auth (GitHub + Google OAuth)
PostgreSQL + Prisma 7       →  database + ORM
pg-boss                     →  background jobs (runs on Postgres)
Stripe Billing              →  payments + webhooks
Resend                      →  transactional email
Tailwind CSS v4             →  styling
Zod v4                      →  validation
Railway                     →  one-click deploy
```

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/Afz07/OperationalKit
cd OperationalKit

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, OAuth keys, Stripe keys, Resend key

# 4. Database — start local Postgres with Docker (optional)
docker compose up -d

# apply the schema (this also seeds demo data)
npx prisma migrate dev --name init

# (optional) verify everything is wired up
npm run setup

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How it works

```
User signs up
  └─► creates Workspace (Organization)
        └─► invites teammates → email sent via Resend (background job)
              └─► teammate accepts → joins as Member
                    └─► owner upgrades plan → Stripe Checkout
                          └─► webhook fires → Subscription updated in DB
```

All of this is wired up. You build the features on top.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                       # Landing page
│   ├── auth/signin/                   # GitHub / Google sign-in
│   ├── onboarding/                    # Create first workspace
│   ├── invite/[token]/                # Accept team invitation
│   ├── admin/                         # Admin panel (ADMIN_EMAILS only)
│   ├── (app)/dashboard/[orgSlug]/
│   │   ├── page.tsx                   # Workspace overview
│   │   ├── billing/                   # Plan + Stripe checkout
│   │   ├── settings/                  # Team members + invite form
│   │   └── jobs/                      # Background job history
│   └── api/
│       ├── auth/[...nextauth]/        # NextAuth handler
│       ├── orgs/                      # Create org, remove members
│       ├── invitations/               # Send invite + enqueue job
│       ├── jobs/register/             # Register pg-boss handlers
│       └── stripe/                    # Checkout, webhook, portal
├── lib/
│   ├── auth.ts                        # NextAuth + PrismaAdapter config
│   ├── db.ts                          # Prisma singleton
│   ├── org.ts                         # Multi-tenant helpers + RBAC
│   ├── jobs.ts                        # pg-boss wrapper
│   ├── stripe.ts                      # Stripe client + PLANS config
│   └── email.ts                       # Resend + email templates
└── components/dashboard/
    ├── Sidebar.tsx                    # Nav + org switcher
    ├── InviteForm.tsx                 # Client component
    ├── RemoveMemberButton.tsx         # Client component
    └── UpgradeButton.tsx              # Stripe checkout trigger
```

---

## Adding a background job

```typescript
// Enqueue from anywhere in your app
import { enqueueJob, JOB_NAMES } from "@/lib/jobs";

await enqueueJob("send-weekly-report", { userId: "123" });
```

```typescript
// Register the handler in src/app/api/jobs/register/route.ts
await registerJob("send-weekly-report", async (jobs) => {
  for (const job of jobs) {
    const { userId } = job.data;
    // your logic here
  }
});
```

pg-boss handles retries, concurrency, and dead-letter queues automatically.

---

## Environment variables

```env
DATABASE_URL="postgresql://..."

AUTH_SECRET=""                    # openssl rand -base64 32
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."

RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAILS="your@email.com"
```

See `.env.example` for the full list with comments.

---

## Deploy

### Railway (recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click the button above
2. Add a PostgreSQL plugin
3. Set environment variables
4. Done — migrations run automatically on deploy

### Vercel + Supabase / Neon

1. Push to GitHub → import on [vercel.com/new](https://vercel.com/new)
2. Create a Postgres database (Supabase or Neon)
3. Set env vars in Vercel dashboard
4. Run `npx prisma migrate deploy` on first deploy

---

## Roadmap

- [ ] Feature flags (lightweight, stored in Postgres)
- [ ] Audit log per organization
- [ ] Webhook delivery (outbound) with retry
- [ ] Usage-based billing support

PRs welcome.

---

## License

MIT — free to use, modify, and self-host. No attribution required.
