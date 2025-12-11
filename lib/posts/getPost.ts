import { firestore } from "@/firebase/clientApp";
import { Post } from "@/types/post";
import { doc, getDoc } from "firebase/firestore";

/**
 * Loads a single post by id without JSON stringification.
 * Used in client hooks where Firestore types are acceptable.
 * @param postId - Post id to fetch.
 * @returns Post data with id or null when missing.
 */
export const getPost = async (postId: string) => {
  const postDocRef = doc(firestore, "posts", postId);
  const postDoc = await getDoc(postDocRef);
  if (postDoc.exists()) {
    return { id: postDoc.id, ...(postDoc.data() as Post) };
  }
  return null;
};
