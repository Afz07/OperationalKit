import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { MemberRole } from "@prisma/client";

// Get the current user's active organization from session
export async function getCurrentOrg(orgSlug: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
    },
    include: { organization: true },
  });

  return membership ?? null;
}

// Check if current user has required role in an org
export async function requireOrgRole(
  orgSlug: string,
  minimumRole: MemberRole = MemberRole.MEMBER
) {
  const membership = await getCurrentOrg(orgSlug);
  if (!membership) throw new Error("Not a member of this organization");

  const roleHierarchy: MemberRole[] = [
    MemberRole.MEMBER,
    MemberRole.ADMIN,
    MemberRole.OWNER,
  ];
  const userLevel = roleHierarchy.indexOf(membership.role);
  const requiredLevel = roleHierarchy.indexOf(minimumRole);

  if (userLevel < requiredLevel) {
    throw new Error("Insufficient permissions");
  }

  return membership;
}

// Create a new organization and make the creator the owner
export async function createOrganization(userId: string, name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const uniqueSlug = await ensureUniqueSlug(slug);

  const org = await db.organization.create({
    data: {
      name,
      slug: uniqueSlug,
      memberships: {
        create: { userId, role: MemberRole.OWNER },
      },
    },
  });

  return org;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}
