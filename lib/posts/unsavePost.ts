import { firestore } from "@/firebase/clientApp";
import { deleteDoc, doc } from "firebase/firestore";

/**
 * Removes a saved post entry for a user.
 * @param userId - Auth uid whose saved list should be updated.
 * @param postId - Post id to delete.
 * @returns Resolves when deletion completes.
 */
export const unsavePost = async (userId: string, postId: string) => {
  await deleteDoc(doc(firestore, `users/${userId}/savedPosts`, postId));
};
