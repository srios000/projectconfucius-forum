import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Sets a user's profile image URL.
 *
 * Phase A stub: the actual upload pathway is deferred to Phase B —
 * `selectedFile` is an already-resolved URL string; this only persists it.
 * @param userId - The local user id.
 * @param selectedFile - The already-resolved image URL.
 * @returns A promise that resolves to the stored image URL.
 */
export const uploadProfileImage = async (
  userId: string,
  selectedFile: string
) => {
  await db
    .update(users)
    .set({ imageUrl: selectedFile })
    .where(eq(users.id, userId));

  return selectedFile;
};
