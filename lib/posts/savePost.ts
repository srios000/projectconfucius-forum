import { firestore } from "@/firebase/clientApp";
import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import { doc, setDoc } from "firebase/firestore";

/**
 * Saves a post for a user by writing to their `savedPosts` subcollection.
 * @param userId - Auth uid saving the post.
 * @param post - Post to persist with minimal metadata.
 * @returns Saved post payload for local caching.
 */
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
