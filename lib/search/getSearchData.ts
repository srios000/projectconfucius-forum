import { db } from "@/lib/db";
import { communities, posts } from "@/lib/db/schema";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { desc, ilike } from "drizzle-orm";

/**
 * Searches communities and posts for a query string.
 * Returns up to 5 matching communities (by id) and up to 5 matching posts
 * (by title, newest first).
 * @param q - The search query.
 * @returns A promise that resolves to `{ communities, posts }`.
 */
export const getSearchData = async (q: string) => {
  const communityRows = await db
    .select()
    .from(communities)
    .where(ilike(communities.id, `%${q}%`))
    .limit(5);

  const postRows = await db
    .select()
    .from(posts)
    .where(ilike(posts.title, `%${q}%`))
    .orderBy(desc(posts.createdAt))
    .limit(5);

  return {
    communities: communityRows as unknown as Community[],
    posts: postRows as unknown as Post[],
  };
};
