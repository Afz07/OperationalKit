# OperationalKit

**Production-ready Next.js SaaS template for solo developers.**

Stop spending the first week setting up auth and billing. Clone this, configure your env, run migrate — your foundation is ready.

## What's included

| Feature | Details |
|---------|---------|
| **Multi-tenant auth** | Organizations, roles (Owner/Admin/Member), invite links, org switching |
| **Background jobs** | pg-boss queue on Postgres — no Redis needed |
| **Stripe billing** | Checkout sessions, webhook handler, subscription sync |
| **Email** | Resend integration with invitation & welcome templates |
| **Admin panel** | Org + job overview for your own account (`/admin`) |
| **Type-safe** | Next.js 15 + TypeScript + Prisma 7 + Zod — 0 TS errors |

## Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** NextAuth v5 + GitHub & Google OAuth
- **Database:** PostgreSQL + Prisma 7 ORM
- **Jobs:** pg-boss (runs on Postgres, no extra infra)
- **Payments:** Stripe Billing
- **Email:** Resend
- **Styles:** Tailwind CSS

## Quick start

```bash
# 1. Clone
git clone https://github.com/Afz07/my-first-project
cd my-first-project

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, OAuth keys, Stripe keys, Resend key

# 4. Database
npx prisma migrate dev --name init

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL="postgresql://..."       # Your Postgres URL
AUTH_SECRET=""                        # openssl rand -base64 32

AUTH_GITHUB_ID=""                     # github.com/settings/apps
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""                     # console.cloud.google.com
AUTH_GOOGLE_SECRET=""

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."     # stripe listen --forward-to localhost:3000/api/stripe/webhook
STRIPE_PRO_PRICE_ID="price_..."

RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAILS="your@email.com"         # Comma-separated admin emails for /admin panel
```

## Deploy

### Railway (recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click deploy button
2. Add a PostgreSQL plugin
3. Set environment variables
4. Done

### Vercel + Supabase

1. Push to GitHub
2. Import on [vercel.com/new](https://vercel.com/new)
3. Create a [Supabase](https://supabase.com) project, copy the connection string
4. Set all env vars in Vercel dashboard
5. Run `npx prisma migrate deploy` via Vercel CLI or a migration job

## Project structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── auth/signin/                  # Sign-in page
│   ├── onboarding/                   # Create first workspace
│   ├── invite/[token]/               # Accept invite
│   ├── admin/                        # Admin panel (protected by ADMIN_EMAILS)
│   ├── (app)/dashboard/[orgSlug]/    # App dashboard
│   │   ├── page.tsx                  # Overview
│   │   ├── billing/                  # Billing & plan
│   │   ├── settings/                 # Team & invites
│   │   └── jobs/                     # Job history
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth handler
│       ├── orgs/                     # Create org, remove members
│       ├── invitations/              # Send invite
│       ├── jobs/register/            # Register job handlers
│       └── stripe/                   # Checkout + webhook
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── db.ts                         # Prisma singleton
│   ├── org.ts                        # Multi-tenant helpers
│   ├── jobs.ts                       # pg-boss wrapper
│   ├── stripe.ts                     # Stripe + PLANS
│   └── email.ts                      # Resend + templates
└── components/
    └── dashboard/
        ├── Sidebar.tsx
        ├── InviteForm.tsx
        └── RemoveMemberButton.tsx
```

## Adding your first background job

```typescript
// In your API route or server action:
import { enqueueJob } from "@/lib/jobs";

await enqueueJob("send-report", { userId: "123", reportType: "weekly" });
```

```typescript
// In src/app/api/jobs/register/route.ts — add a new handler:
await registerJob("send-report", async (jobs) => {
  for (const job of jobs) {
    const { userId, reportType } = job.data;
    // do the work...
  }
});
```

## License

MIT — free to use, modify, and self-host.
