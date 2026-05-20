"use client";

import { useCallback, useEffect, useState } from "react";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";

/**
 * A custom hook that manages the retrieval and state of comments for a specific post.
 * It automatically fetches comments when the selected post changes and provides a loading state.
 * @param selectedPost - The post object for which comments are being loaded.
 * @returns An object containing the comments array, a setter for comments, a loading flag, and a function to reload comments.
 */
const useCommentList = (selectedPost: Post | null) => {
  const showToast = useCustomToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const postId = selectedPost?.id ?? "";

  const query = useCommentsForPostQuery({
    postId,
    enabled: !!selectedPost,
  });

  useEffect(() => {
    if (query.data) setComments(query.data);
    if (query.error) {
      showToast({
        title: "Error fetching comments",
        description: "There was an error fetching comments",
        status: "error",
      });
    }
  }, [query.data, query.error, showToast]);

  const loadComments = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    comments,
    setComments,
    commentFetchLoading: query.isLoading,
    loadComments,
  };
};

export default useCommentList;