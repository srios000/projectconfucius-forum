import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

/**
 * Clears a community's image URL.
 * @param communityId - The unique identifier of the community.
 * @returns A promise that resolves when the community row is updated.
 */
export const deleteCommunityImage = async (communityId: string) => {
  const existing = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { imageUrl: true },
  });
  await db.update(communities).set({ imageUrl: null }).where(eq(communities.id, communityId));

  const key = parseForumObjectKey(existing?.imageUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deleteCommunityImage] best-effort R2 delete failed", err);
    });
  }
};