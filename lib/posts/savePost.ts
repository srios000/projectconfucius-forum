import { firestore } from "@/firebase/clientApp";
import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import { doc, setDoc } from "firebase/firestore";

export const savePost = async (userId: string, post: Post) => {
  const savedPostRef = doc(firestore, `users/${userId}/savedPosts`, post.id!);
  const newSavedPost: SavedPost = {
    id: post.id!,
    postId: post.id!,
    communityId: post.communityId,
    postTitle: post.title,
    communityImageURL: post.communityImageURL || "",
  };
  await setDoc(savedPostRef, newSavedPost);
  return newSavedPost;
};
