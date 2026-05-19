import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";

import { AdminUser } from "../../types/adminUser";

/**
 * Performs a substring search for users by email address.
 * Used in administrative interfaces to find users for promotion or moderation.
 * @param emailQuery - The search string to match against user emails.
 * @returns A promise that resolves to an array of up to 10 matching users.
 */
export const searchUsersByEmail = async (
  emailQuery: string
): Promise<AdminUser[]> => {
  if (emailQuery.length < 3) {
    return [];
  }

  const rows = await db
    .select()
    .from(users)
    .where(ilike(users.email, `%${emailQuery}%`))
    .limit(10);

  return rows.map((r) => ({
    uid: r.id,
    email: r.email,
    displayName: r.name,
  }));
};
