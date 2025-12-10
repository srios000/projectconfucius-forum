import { useCallback, useEffect, useState } from "react";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { getComments as getCommentsLib } from "@/lib/comments/getComments";

/**
 * Loads comments for the selected post and keeps them in local state.
 * @param selectedPost - Post whose comments should be fetched.
 * @returns Comment list, setter, loading flag, and a reload function.
 */
const useCommentList = (selectedPost: Post | null) => {
  const showToast = useCustomToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFetchLoading, setCommentFetchLoading] = useState(true);

  const loadComments = useCallback(async () => {
    if (!selectedPost) return;
    setCommentFetchLoading(true);
    try {
      const comments = await getCommentsLib(selectedPost.id!);
      setComments(comments);
    } catch (error: any) {
      console.log("getPostComments error", error);
      showToast({
        title: "Error fetching comments",
        description: "There was an error fetching comments",
        status: "error",
      });
    } finally {
      setCommentFetchLoading(false);
    }
  }, [selectedPost, showToast]);

  useEffect(() => {
    if (selectedPost) {
      loadComments();
    }
  }, [selectedPost, loadComments]);

  return {
    comments,
    setComments,
    commentFetchLoading,
    loadComments,
  };
};

export default useCommentList;
