import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// `npm run setup` — a one-shot check that tells you whether the project is ready
// to run: required env vars, optional services, database connection, and whether
// the schema/migrations have been applied. Prints a ✅/❌ checklist and exits
// non-zero if anything required is missing (handy in CI).

const ok = (m: string) => console.log(`  ✅ ${m}`);
const fail = (m: string) => console.log(`  ❌ ${m}`);
const warn = (m: string) => console.log(`  ⚠️  ${m}`);

const firstLine = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  const line = msg
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ?? (e instanceof Error ? e.name : "unknown error");
};

let hasError = false;

function checkRequiredEnv() {
  console.log("\nRequired environment:");
  const required: [string, string][] = [
    ["DATABASE_URL", "PostgreSQL connection string — see .env.example"],
    ["AUTH_SECRET", "generate with: openssl rand -base64 32"],
  ];
  for (const [key, hint] of required) {
    if (process.env[key]) ok(key);
    else {
      fail(`${key} missing — ${hint}`);
      hasError = true;
    }
  }
}

function checkOptionalServices() {
  console.log("\nOptional services:");
  const github = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const google = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const stripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
  const resend = Boolean(process.env.RESEND_API_KEY);

  (github ? ok : warn)(`GitHub OAuth ${github ? "configured" : "not configured"}`);
  (google ? ok : warn)(`Google OAuth ${google ? "configured" : "not configured"}`);
  (stripe ? ok : warn)(`Stripe billing ${stripe ? "configured" : "disabled"}`);
  (resend ? ok : warn)(`Resend email ${resend ? "configured" : "disabled — emails are skipped"}`);

  if (!github && !google) {
    warn("No OAuth provider set — in development you can use the dev login button.");
  }
}

async function checkDatabase() {
  console.log("\nDatabase:");
  if (!process.env.DATABASE_URL) {
    fail("DATABASE_URL not set — skipping database checks");
    hasError = true;
    return;
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    await db.$queryRaw`SELECT 1`;
    ok("Database connection");
  } catch (e) {
    fail(`Cannot reach database — ${firstLine(e)}`);
    warn('Is it running? Try "docker compose up -d", then verify DATABASE_URL.');
    hasError = true;
    await db.$disconnect();
    return;
  }

  try {
    const users = await db.user.count();
    ok(`Schema applied — ${users} user(s) in the database`);
  } catch (e) {
    if ((e as { code?: string }).code === "P2021") {
      fail('Schema not applied yet — run "npx prisma migrate dev"');
    } else {
      fail(`Schema check failed — ${firstLine(e)}`);
    }
    hasError = true;
  } finally {
    await db.$disconnect();
  }
}

async function main() {
  console.log("🩺 OperationalKit setup check");
  console.log("=".repeat(40));

  checkRequiredEnv();
  checkOptionalServices();
  await checkDatabase();

  console.log("\n" + "=".repeat(40));
  if (hasError) {
    console.log("❌ Not ready yet — fix the items marked ❌ above.");
    console.log("   See .env.example and the README quick start.");
    process.exit(1);
  }
  console.log("✅ All set — run `npm run dev` and open http://localhost:3000");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
