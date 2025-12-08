import { Dispatch, SetStateAction, useState } from "react";
import { doc, increment, writeBatch } from "firebase/firestore";
import { firestore } from "@/firebase/clientApp";
import { postStateAtom } from "@/atoms/postsAtom";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";

/**
 * Deletes a comment and its replies while syncing counts on the parent post.
 * @param comment - Comment to remove along with its descendants.
 * @returns Delete handler and the id of the comment currently being deleted.
 */
const useDeleteComment = (
  comments: Comment[],
  setComments: Dispatch<SetStateAction<Comment[]>>
) => {
  const setPostState = useSetAtom(postStateAtom);
  const showToast = useCustomToast();
  const [deleteLoadingId, setDeleteLoadingId] = useState("");

  const deleteComment = async (comment: Comment) => {
    setDeleteLoadingId(comment.id);
    try {
      const batch = writeBatch(firestore);

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

      allIdsToDelete.forEach((id) => {
        const commentDocRef = doc(firestore, "comments", id);
        batch.delete(commentDocRef);
      });

      const postDocRef = doc(firestore, "posts", comment.postId);
      batch.update(postDocRef, {
        numberOfComments: increment(-allIdsToDelete.length),
      });

      await batch.commit();

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
    deleteComment,
    deleteLoadingId,
  };
};

export default useDeleteComment;
