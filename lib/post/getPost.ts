import { firestore } from "@/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import safeJsonStringify from "safe-json-stringify";
import { Post } from "@/types/post";

/**
 * Fetches a post by id from Firestore and returns a JSON-safe object.
 * @param postId - Identifier of the post to retrieve.
 * @returns Post data or null when missing or on error.
 */
export async function getPost(postId: string) {
  try {
    const postDocRef = doc(firestore, "posts", postId);
    const postDoc = await getDoc(postDocRef);

    if (!postDoc.exists()) {
      return null;
    }

    return JSON.parse(
      safeJsonStringify({ id: postDoc.id, ...postDoc.data() })
    ) as Post;
  } catch (error) {
    console.log("Error: getPost", error);
    return null;
  }
}
