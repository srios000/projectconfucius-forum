import { firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";

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
