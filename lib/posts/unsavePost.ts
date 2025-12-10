import { firestore } from "@/firebase/clientApp";
import { deleteDoc, doc } from "firebase/firestore";

export const unsavePost = async (userId: string, postId: string) => {
  await deleteDoc(doc(firestore, `users/${userId}/savedPosts`, postId));
};
