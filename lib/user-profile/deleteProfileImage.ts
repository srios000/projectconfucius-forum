import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

/**
 * Clears a user's profile image URL.
 * @param userId - The local user id.
 * @returns A promise that resolves when the user row is updated.
 */
export const deleteProfileImage = async (userId: string) => {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { imageUrl: true },
  });
  await db.update(users).set({ imageUrl: null, updatedAt: new Date() }).where(eq(users.id, userId));

  const key = parseForumObjectKey(existing?.imageUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deleteProfileImage] best-effort R2 delete failed", err);
    });
  }
};