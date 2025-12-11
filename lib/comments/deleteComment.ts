import { firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";

/**
 * Deletes a comment and any threaded descendants, then decrements the post's comment count.
 * @param commentId - Comment id to delete.
 * @param postId - Parent post id whose count should be updated.
 * @param descendantIds - Child comment ids collected by the caller.
 * @returns Number of comments removed to mirror the counter change.
 */
export const deleteComment = async (
  commentId: string,
  postId: string,
  descendantIds: string[]
) => {
  const batch = writeBatch(firestore);
  const allIdsToDelete = [commentId, ...descendantIds];

  allIdsToDelete.forEach((id) => {
    const commentDocRef = doc(firestore, "comments", id);
    batch.delete(commentDocRef);
  });

  const postDocRef = doc(firestore, "posts", postId);
  batch.update(postDocRef, {
    numberOfComments: increment(-allIdsToDelete.length),
  });

  await batch.commit();
  return allIdsToDelete.length;
};
