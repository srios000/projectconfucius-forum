import { firestore } from "@/firebase/clientApp";
import { Comment } from "@/types/comment";
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { User } from "firebase/auth";

/**
 * Creates a new comment document, supports threading up to depth 2, and bumps the post's comment count.
 * @param user - Auth user authoring the comment.
 * @param communityId - Community id for the parent post.
 * @param postId - Post id the comment belongs to.
 * @param postTitle - Cached title for search and saved lists.
 * @param commentText - Comment body text.
 * @param depth - Zero-based depth used to stop over-nesting.
 * @param parentId - Optional parent comment id for threaded replies.
 * @returns Newly created comment payload for optimistic UI.
 */
export const createComment = async (
  user: User,
  communityId: string,
  postId: string,
  postTitle: string,
  commentText: string,
  depth: number,
  parentId?: string
) => {
  if (depth > 2) {
    throw new Error(
      "Maximum comment depth reached. You cannot reply to this comment."
    );
  }

  const batch = writeBatch(firestore);
  const commentDocRef = doc(collection(firestore, "comments"));
  const newComment: Comment = {
    id: commentDocRef.id,
    creatorId: user.uid,
    creatorDisplayText: user.email!.split("@")[0],
    communityId: communityId,
    postId: postId,
    postTitle: postTitle,
    text: commentText,
    createdAt: serverTimestamp() as Timestamp,
    parentId: parentId || undefined,
    depth: depth,
  };

  if (!parentId) delete newComment.parentId;

  batch.set(commentDocRef, newComment);

  const postDocRef = doc(firestore, "posts", postId);
  batch.update(postDocRef, {
    numberOfComments: increment(1),
  });

  await batch.commit();
  return newComment;
};
