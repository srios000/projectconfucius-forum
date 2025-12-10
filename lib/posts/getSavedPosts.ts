import { firestore } from "@/firebase/clientApp";
import { SavedPost } from "@/types/savedPost";
import { collection, getDocs } from "firebase/firestore";

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
