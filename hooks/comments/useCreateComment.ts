import { Dispatch, SetStateAction, useState } from "react";
import { User } from "firebase/auth";
import { postStateAtom } from "@/atoms/postsAtom";
import { Post } from "@/types/post";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { createComment } from "@/lib/comments/createComment";

/**
 * Creates a new comment or reply on the selected post and updates counts.
 * @param user - Authenticated user authoring the comment.
 * @param commentText - Text body of the comment.
 * @param parentId - Optional parent comment id for threaded replies.
 * @returns Comment creation handler and loading flag.
 */
const useCreateComment = (
  selectedPost: Post | null,
  setComments: Dispatch<SetStateAction<Comment[]>>
) => {
  const setPostState = useSetAtom(postStateAtom);
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);

  const onCreateComment = async (
    user: User,
    commentText: string,
    parentId?: string,
    depth: number = 0
  ) => {
    if (!selectedPost) return;
    setCreateLoading(true);
    try {
      const newComment = await createComment(
        user,
        selectedPost.communityId,
        selectedPost.id!,
        selectedPost.title,
        commentText,
        depth,
        parentId
      );

      setComments((prev) => [newComment, ...prev]);
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost!,
          numberOfComments: prev.selectedPost!.numberOfComments + 1,
        },
      }));
    } catch (error: any) {
      console.log("onCreateComment error", error);
      showToast({
        title: "Comment failed",
        description:
          error.message || "There was an error creating your comment",
        status: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    createComment: onCreateComment,
    createLoading,
  };
};

export default useCreateComment;
