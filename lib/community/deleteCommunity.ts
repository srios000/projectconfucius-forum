import { db } from "@/lib/db";
import { communities, posts } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { eq, isNotNull, and } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

/**
 * Deletes a community. Posts → comments → votes → saved posts and the
 * community_members rows all cascade via `ON DELETE CASCADE` foreign keys.
 * @param communityData - The community to delete (only `id` is required).
 * @returns A promise that resolves when the community has been removed.
 */
export const deleteCommunity = async (communityData: Community) => {
  const [community, postRows] = await Promise.all([
    db.query.communities.findFirst({
      where: eq(communities.id, communityData.id),
      columns: { imageUrl: true },
    }),
    db
      .select({ imageUrl: posts.imageUrl })
      .from(posts)
      .where(and(eq(posts.communityId, communityData.id), isNotNull(posts.imageUrl))),
  ]);

  await db.delete(communities).where(eq(communities.id, communityData.id));

  const keys = [
    parseForumObjectKey(community?.imageUrl),
    ...postRows.map((r) => parseForumObjectKey(r.imageUrl)),
  ].filter((k): k is string => k !== null);

  if (keys.length) {
    Promise.allSettled(keys.map((k) => deleteForumObject(k))).then((results) => {
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed) {
        console.error(`[deleteCommunity] ${failed}/${keys.length} R2 deletes failed`);
      }
    });
  }
};