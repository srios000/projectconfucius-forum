import { db } from "@/lib/db";
import { communityMembers, users } from "@/lib/db/schema";
import { AdminUser } from "@/types/adminUser";
import { and, eq } from "drizzle-orm";

/**
 * Retrieves the moderators of a community (members with `isModerator = true`),
 * joined with their user profile. Returns admin-level info including email,
 * since this query is only consumed by admin-management UIs.
 * @param communityId - The unique identifier of the community.
 * @returns A promise that resolves to an array of admin users.
 */
export const fetchCommunityAdmins = async (
  communityId: string
): Promise<AdminUser[]> => {
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, username: users.username })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.isModerator, true)
      )
    );

  return rows.map((r) => ({
    uid: r.id,
    email: r.email || "Unknown email",
    username: r.username ?? null,
    displayName: r.name ?? undefined,
  }));
};
