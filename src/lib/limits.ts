import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

// ─── Free-tier limits ─────────────────────────────────────────────────────────
// All limits are lifted for an organization with an active ("Pro") subscription.
// Adjust the numbers here — or the logic in the helpers below — to fit your product.

export const FREE_LIMITS = {
  workspaces: 1, // organizations a single user can own
  members: 3, // members + pending invites per organization
  jobs: 5, // background jobs recorded per organization
} as const;

// Thrown when an action would exceed a free-tier limit. Routes catch this and
// return HTTP 402 (Payment Required) with the message shown to the user.
export class LimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitError";
  }
}

// An organization is "Pro" (unlimited) when it has an active subscription.
export async function isOrgPro(organizationId: string): Promise<boolean> {
  const sub = await db.subscription.findFirst({
    where: { organizationId, status: "active" },
    select: { id: true },
  });
  return sub !== null;
}

// ─── Workspaces (per user) ────────────────────────────────────────────────────
// A user may own FREE_LIMITS.workspaces organizations. To own more, at least one
// of their existing organizations must be on Pro.
export async function assertCanCreateWorkspace(userId: string): Promise<void> {
  const ownedCount = await db.membership.count({
    where: { userId, role: MemberRole.OWNER },
  });

  if (ownedCount < FREE_LIMITS.workspaces) return;

  const proOrg = await db.subscription.findFirst({
    where: {
      status: "active",
      organization: {
        memberships: { some: { userId, role: MemberRole.OWNER } },
      },
    },
    select: { id: true },
  });

  if (!proOrg) {
    throw new LimitError(
      `The Free plan allows ${FREE_LIMITS.workspaces} workspace. Upgrade to Pro to create more.`
    );
  }
}

// ─── Members (per organization) ───────────────────────────────────────────────
// Counts current members plus outstanding (unaccepted, unexpired) invitations so
// a burst of invites can't blow past the cap once they're accepted.
export async function assertCanAddMember(organizationId: string): Promise<void> {
  if (await isOrgPro(organizationId)) return;

  const [members, pending] = await Promise.all([
    db.membership.count({ where: { organizationId } }),
    db.invitation.count({
      where: {
        organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  if (members + pending >= FREE_LIMITS.members) {
    throw new LimitError(
      `The Free plan is limited to ${FREE_LIMITS.members} team members. Upgrade to Pro for unlimited members.`
    );
  }
}

// ─── Background jobs (per organization) ───────────────────────────────────────
// Call this before enqueuing any org-scoped job so new job types are capped too.
export async function assertWithinJobQuota(organizationId: string): Promise<void> {
  if (await isOrgPro(organizationId)) return;

  const count = await db.jobLog.count({ where: { organizationId } });

  if (count >= FREE_LIMITS.jobs) {
    throw new LimitError(
      `The Free plan is limited to ${FREE_LIMITS.jobs} background jobs. Upgrade to Pro for unlimited jobs.`
    );
  }
}
