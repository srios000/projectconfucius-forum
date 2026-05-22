import { db } from "@/lib/db";
import { savedPosts } from "@/lib/db/schema";

/**
 * Saves a post to a user's personal collection for later viewing.
 * This creates a document in the user's 'savedPosts' subcollection with essential post metadata.
 * @param userId - The unique identifier of the user saving the post.
 * @param post - The post object to be saved.
 * @returns A promise that resolves to the newly created saved post object.
 */
export const savePost = async (userId: string, p: { id: string; communityId: string | null; title: string; communityImageUrl?: string }) => {
  await db.insert(savedPosts).values({ userId, postId: p.id, communityId: p.communityId, postTitle: p.title, communityImageUrl: p.communityImageUrl ?? null })
    .onConflictDoNothing();
};