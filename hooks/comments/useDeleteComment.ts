import { uiAtom } from "@/atoms/uiAtom";
import { useSetAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { useDeleteCommentMutation } from "@/lib/queries/comments/use-delete-comment-mutation";

/**
 * Shell over useDeleteCommentMutation. Preserves the public `deleteComment` /
 * `deleteLoadingId` surface. The server cascades descendant deletes; the
 * post-detail count refreshes via posts.detail invalidation. The uiAtom
 * mirror decrements by 1 (best-effort header update) and is corrected by the
 * invalidated query.
 */
/**
 * A custom hook that provides functionality for deleting comments and their threaded replies.
 * It calculates all descendant comment IDs to ensure a clean cascading delete and updates the post's comment count.
 * @returns An object containing the `onDeleteComment` function and the ID of the comment currently being deleted.
 */
const useDeleteComment = () => {
  const setUi = useSetAtom(uiAtom);
  const showToast = useCustomToast();
  const [deleteLoadingId, setDeleteLoadingId] = useState("");
  const mutation = useDeleteCommentMutation();

  const onDeleteComment = async (comment: Comment) => {
    setDeleteLoadingId(comment.id);
    try {
      await mutation.mutateAsync({ commentId: comment.id, postId: comment.postId });
      setUi((prev) =>
        prev.selectedPost
          ? {
            ...prev,
            selectedPost: {
              ...prev.selectedPost,
              numberOfComments: Math.max(0, prev.selectedPost.numberOfComments - 1),
            },
          }
          : prev,
      );
    } catch (error: any) {
      console.log("onDeleteComment error", error);
      showToast({
        title: "Delete failed",
        description: "There was an error deleting your comment",
        status: "error",
      });
    } finally {
      setDeleteLoadingId("");
    }
  };

  return { deleteComment: onDeleteComment, deleteLoadingId };
};

export default useDeleteComment;