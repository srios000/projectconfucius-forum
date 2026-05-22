import { db } from "@/lib/db";
import { savedPosts } from "@/lib/db/schema";
import { SavedPost } from "@/types/savedPost";
import { eq } from "drizzle-orm";

/**
 * Retrieves all posts saved by a specific user from their personal 'savedPosts' subcollection.
 * This is used to populate the 'Saved' tab in the user's profile or dashboard.
 * @param userId - The unique identifier of the user whose saved posts are being retrieved.
 * @returns A promise that resolves to an array of saved post objects.
 */
export const getSavedPosts = async (userId: string): Promise<SavedPost[]> =>
  (await db.select().from(savedPosts).where(eq(savedPosts.userId, userId)))
    .map((r) => ({ id: r.postId, postId: r.postId, communityId: r.communityId ?? "", postTitle: r.postTitle, communityImageUrl: r.communityImageUrl ?? undefined }));