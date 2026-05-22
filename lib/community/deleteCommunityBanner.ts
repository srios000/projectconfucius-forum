import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteForumObject, parseForumObjectKey } from "@/lib/storage/r2-forum";

export const deleteCommunityBanner = async (communityId: string) => {
  const existing = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { bannerUrl: true },
  });
  await db.update(communities).set({ bannerUrl: null }).where(eq(communities.id, communityId));

  const key = parseForumObjectKey(existing?.bannerUrl);
  if (key) {
    deleteForumObject(key).catch((err) => {
      console.error("[deleteCommunityBanner] best-effort R2 delete failed", err);
    });
  }
};
