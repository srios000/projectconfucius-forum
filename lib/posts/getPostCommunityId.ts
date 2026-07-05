import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolves the owning community of a post from its (globally unique) id.
 *
 * A post's community never changes, so the mapping is immutable — cached
 * indefinitely (`revalidate: false`) and only ever busted via the `posts` tag.
 * Selects the single `communityId` column to keep the query cheap. Returns null
 * for wall posts (no community) or unknown ids.
 */
export const getPostCommunityId = unstable_cache(
  async (postId: string): Promise<string | null> => {
    const row = await db.query.posts.findFirst({
      columns: { communityId: true },
      where: eq(posts.id, postId),
    });
    return row?.communityId ?? null;
  },
  ["post-community-id"],
  { revalidate: false, tags: ["posts"] },
);
