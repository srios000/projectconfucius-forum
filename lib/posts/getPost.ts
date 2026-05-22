import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { eq } from "drizzle-orm";

/**
 * Retrieves a single post by its unique identifier from Firestore.
 * Unlike the SSR version, this returns the raw Firestore data without JSON stringification.
 * @param postId - The unique identifier of the post to be retrieved.
 * @returns A promise that resolves to the post object if found, or null if it does not exist.
 */
export const getPost = async (postId: string): Promise<Post | null> => {
  const row = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  return (row as unknown as Post) ?? null;
};