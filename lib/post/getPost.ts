import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { Post } from "@/types/post";
import { eq } from "drizzle-orm";

export const getPost = async (postId: string): Promise<Post | null> => {
  const row = await db.query.posts.findFirst({ where: eq(posts.id, postId) });
  return (row as unknown as Post) ?? null;
};