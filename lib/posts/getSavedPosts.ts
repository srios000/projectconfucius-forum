import { firestore } from "@/firebase/clientApp";
import { SavedPost } from "@/types/savedPost";
import { collection, getDocs } from "firebase/firestore";

/**
 * Loads all saved posts for a user from their subcollection.
 * @param userId - Auth uid whose saved posts should be read.
 * @returns Array of saved post metadata for the saved tab.
 */
export const getSavedPosts = async (userId: string) => {
  const querySnapshot = await getDocs(
    collection(firestore, `users/${userId}/savedPosts`)
  );
  const savedPosts = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SavedPost[];
  return savedPosts;
};
