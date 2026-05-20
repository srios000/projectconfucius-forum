import { Post } from "@/types/post";
import React from "react";
import { useDeletePostMutation } from "@/lib/queries/posts/use-delete-post";

type UsePostDeletionOpts = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
};

/**
 * A custom hook that provides functionality for deleting a post and its associated data.
 * It optimistically updates the local post and saved post states and handles rollback if the deletion fails.
 * @param setPostStateValue - A state setter function to update the global post state.
 * @returns An object containing the `onDeletePost` function and the current post state value.
 */
const usePostDeletion = ({ posts, setPosts }: UsePostDeletionOpts) => {
  const deleteMutation = useDeletePostMutation();

  const onDeletePost = async (post: Post): Promise<boolean> => {
    const snapshot = posts;
    setPosts((prev) => prev.filter((item) => item.id !== post.id));

    try {
      await deleteMutation.mutateAsync({ postId: post.id! });
      return true;
    } catch (error) {
      console.log("Error deleting post", error);
      setPosts(snapshot);
      return false;
    }
  };

  return { onDeletePost };
};

export default usePostDeletion;