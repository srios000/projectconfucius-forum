import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Clears a user's profile image URL.
 * @param userId - The local user id.
 * @returns A promise that resolves when the user row is updated.
 */
export const deleteProfileImage = async (userId: string) => {
  await db
    .update(users)
    .set({ imageUrl: null })
    .where(eq(users.id, userId));
};
