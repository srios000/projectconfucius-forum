import { firestore } from "@/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import safeJsonStringify from "safe-json-stringify";
import { Post } from "@/types/post";

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
