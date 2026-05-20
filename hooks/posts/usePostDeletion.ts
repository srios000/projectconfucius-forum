import { postStateAtom } from "@/atoms/postsAtom";
import { Post, PostVote } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import { useAtom } from "jotai";
import React from "react";
import { deletePostAction } from "@/app/actions/posts";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { useSession } from "@/lib/auth-client";

/**
 * A custom hook that provides functionality for deleting a post and its associated data.
 * It optimistically updates the local post and saved post states and handles rollback if the deletion fails.
 * @param setPostStateValue - A state setter function to update the global post state.
 * @returns An object containing the `onDeletePost` function and the current post state value.
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
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const onDeletePost = async (post: Post): Promise<boolean> => {
    setPostStateValue((prev) => ({
      ...prev,
      posts: prev.posts.filter((item) => item.id !== post.id),
    }));

    if (userId) {
      queryClient.setQueryData<SavedPost[]>(
        keys.posts.saved(userId),
        (old = []) => old.filter((item) => item.postId !== post.id),
      );
    }

    try {
      await deletePostAction(post.id!);
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
