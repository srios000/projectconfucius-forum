import { Dispatch, SetStateAction, useState } from "react";
import { postStateAtom } from "@/atoms/postsAtom";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { deleteComment } from "@/lib/comments/deleteComment";

/**
 * Deletes a comment and its replies while syncing counts on the parent post.
 * Traverses nested replies locally to avoid extra reads.
 * @returns Delete handler and the id of the comment currently being deleted.
 */
const useDeleteComment = (
  comments: Comment[],
  setComments: Dispatch<SetStateAction<Comment[]>>
) => {
  const setPostState = useSetAtom(postStateAtom);
  const showToast = useCustomToast();
  const [deleteLoadingId, setDeleteLoadingId] = useState("");

  const onDeleteComment = async (comment: Comment) => {
    setDeleteLoadingId(comment.id);
    try {
      const getDescendantIds = (parentId: string): string[] => {
        const children = comments.filter((c) => c.parentId === parentId);
        let ids = children.map((c) => c.id);
        children.forEach((child) => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };

      const descendantIds = getDescendantIds(comment.id);
      const allIdsToDelete = [comment.id, ...descendantIds];

      await deleteComment(comment.id, comment.postId, descendantIds);

      setComments((prev) =>
        prev.filter((item) => !allIdsToDelete.includes(item.id))
      );
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost!,
          numberOfComments:
            prev.selectedPost!.numberOfComments - allIdsToDelete.length,
        },
      }));
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

  return {
    deleteComment: onDeleteComment,
    deleteLoadingId,
  };
};

export default useDeleteComment;
