import { postStateAtom } from "@/atoms/postsAtom";
import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import { Post, PostVote } from "@/types/post";
import { useAtom, useSetAtom } from "jotai";
import React from "react";
import { deletePost } from "@/lib/posts/deletePost";

/**
 * Deletes posts along with their assets and related saved entries while keeping state in sync.
 * @param setPostStateValue - Setter for updating post state after deletion attempts.
 * @returns Handler to delete a post and the current post state snapshot.
 */
const usePostDeletion = (
  setPostStateValue: React.Dispatch<
    React.SetStateAction<{
      selectedPost: Post | null;
      posts: Post[];
      postVotes: PostVote[];
    }>
  >
) => {
  const [postStateValue] = useAtom(postStateAtom);
  const setSavedPostState = useSetAtom(savedPostStateAtom);

  const onDeletePost = async (post: Post): Promise<boolean> => {
    setPostStateValue((prev) => ({
      ...prev,
      posts: prev.posts.filter((item) => item.id !== post.id),
    }));

    setSavedPostState((prev) => ({
      ...prev,
      savedPosts: prev.savedPosts.filter((item) => item.postId !== post.id),
    }));

    try {
      await deletePost(post);
      return true;
    } catch (error) {
      console.log("Error deleting post", error);
      setPostStateValue((prev) => ({
        ...prev,
        posts: [...prev.posts, post],
      }));
      return false;
    }
  };

  return { onDeletePost, postStateValue };
};

export default usePostDeletion;
