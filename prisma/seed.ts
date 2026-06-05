import "dotenv/config";
import { PrismaClient, MemberRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Standalone Prisma client so the seed works both via `prisma db seed`
// and when run directly with `tsx prisma/seed.ts`.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

// The seed is idempotent: re-running it updates the same demo rows instead of
// creating duplicates, so it's safe to run as often as you like.
async function main() {
  // ── Demo users ──────────────────────────────────────────────────────────
  const owner = await db.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: { email: "alice@example.com", name: "Alice Owner" },
  });

  const member = await db.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: { email: "bob@example.com", name: "Bob Member" },
  });

  // ── Demo organization ───────────────────────────────────────────────────
  const org = await db.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Inc", slug: "acme" },
  });

  // ── Memberships ─────────────────────────────────────────────────────────
  await db.membership.upsert({
    where: { userId_organizationId: { userId: owner.id, organizationId: org.id } },
    update: { role: MemberRole.OWNER },
    create: { userId: owner.id, organizationId: org.id, role: MemberRole.OWNER },
  });

  await db.membership.upsert({
    where: { userId_organizationId: { userId: member.id, organizationId: org.id } },
    update: { role: MemberRole.MEMBER },
    create: { userId: member.id, organizationId: org.id, role: MemberRole.MEMBER },
  });

  // ── Sample background-job log entries (so the Jobs page isn't empty) ──────
  await db.jobLog.upsert({
    where: { id: "seed-job-1" },
    update: {},
    create: {
      id: "seed-job-1",
      jobName: "send-invitation",
      jobId: "seed-1",
      organizationId: org.id,
      status: "completed",
      completedAt: new Date(),
    },
  });

  await db.jobLog.upsert({
    where: { id: "seed-job-2" },
    update: {},
    create: {
      id: "seed-job-2",
      jobName: "send-email",
      jobId: "seed-2",
      organizationId: org.id,
      status: "failed",
      error: "Demo failure — shown so the dashboard has a failed example",
    },
  });

  console.log("✅ Seed complete: org 'acme' with an owner, a member, and sample jobs");
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
