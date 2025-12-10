import { firestore } from "@/firebase/clientApp";
import { Post } from "@/types/post";
import { doc, getDoc } from "firebase/firestore";

export const getPost = async (postId: string) => {
  const postDocRef = doc(firestore, "posts", postId);
  const postDoc = await getDoc(postDocRef);
  if (postDoc.exists()) {
    return { id: postDoc.id, ...(postDoc.data() as Post) };
  }
  return null;
};
