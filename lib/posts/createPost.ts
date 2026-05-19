import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { randomUUID } from "crypto";

/**
 * Creates a new post within a community and optionally uploads an associated image.
 * This function handles the creation of the post document in Firestore and the image upload to Firebase Storage.
 * @param user - The Firebase Auth user object of the post creator.
 * @param communityId - The unique identifier of the community where the post is being created.
 * @param communityImageURL - The current image URL of the community, used for display in feeds.
 * @param postData - An object containing the title and body text of the post.
 * @param selectedFile - An optional base64 encoded image string to be uploaded with the post.
 * @returns A promise that resolves to the unique identifier of the newly created post.
 */
export const createPost = async (
  author: { id: string; username: string },
  communityId: string,
  communityImageUrl: string | undefined,
  postData: { title: string; body: string },
  imageUrl?: string,
) => {
  const id = randomUUID();
  await db.insert(posts).values({
    id,
    communityId,
    communityImageUrl: communityImageUrl ?? null,
    creatorId: author.id,
    creatorUsername: author.username,
    title: postData.title,
    body: postData.body,
    imageUrl: imageUrl ?? null,
    numberOfComments: 0,
    voteStatus: 0,
  });
  return id;
};  