import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import { AdminUser } from "../../types/adminUser";

/**
 * Finds a user by their exact email address (case-insensitive).
 * Primarily used for administrative tasks like adding a community moderator.
 * @param email - The email address of the user to find.
 * @returns A promise that resolves to the user, or null if no match exists.
 */
export const findUserByEmail = async (
  email: string
): Promise<AdminUser | null> => {
  const row = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (!row) return null;
  return { uid: row.id, email: row.email, displayName: row.name };
};
