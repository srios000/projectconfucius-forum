"use client";

import { useCallback, useEffect } from "react";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";

/**
 * Subscribes to the comments for a post via TanStack Query.
 * After C3 mutations land, the `setComments` mirror is gone — consumers
 * read `comments` straight from the query result. The error toast lives
 * in a useEffect so it fires once per error, not on every render.
 */
/**
 * A custom hook that manages the retrieval and state of comments for a specific post.
 * It automatically fetches comments when the selected post changes and provides a loading state.
 * @param selectedPost - The post object for which comments are being loaded.
 * @returns An object containing the comments array, a setter for comments, a loading flag, and a function to reload comments.
 */
const useCommentList = (selectedPost: Post | null) => {
  const showToast = useCustomToast();
  const postId = selectedPost?.id ?? "";

  const query = useCommentsForPostQuery({
    postId,
    enabled: !!selectedPost,
  });

  useEffect(() => {
    if (query.error) {
      console.error("Error fetching comments", query.error);
      showToast({
        title: "Error fetching comments",
        description: "There was an error fetching comments",
        status: "error",
      });
    }
  }, [query.error, showToast]);

  const comments: Comment[] = query.data ?? [];

  const loadComments = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    comments,
    commentFetchLoading: query.isLoading,
    loadComments,
  };
};

export default useCommentList;