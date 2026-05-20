import { Dispatch, SetStateAction, useState } from "react";
import { uiAtom } from "@/atoms/uiAtom";
import { Post } from "@/types/post";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { createCommentAction } from "@/app/actions/comments";
import useCommunityState from "../community/useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";

/**
 * A custom hook that provides functionality for creating new comments and replies.
 * It handles permission checks for restricted communities and updates the local
 * post state to reflect the new comment count. Comment depth is derived
 * server-side from the parent.
 * @param selectedPost - The post being commented on.
 * @param setComments - A state setter function to update the local comments list.
 * @returns An object containing the `onCreateComment` function and a loading state indicator.
 */
const useCreateComment = (
  selectedPost: Post | null,
  setComments: Dispatch<SetStateAction<Comment[]>>
) => {
  const setUi = useSetAtom(uiAtom);
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);
  const { communityStateValue } = useCommunityState();

  const onCreateComment = async (commentText: string, parentId?: string) => {
    if (!selectedPost) return;
    setCreateLoading(true);

    // Check for restricted community permissions
    const currentCommunity = communityStateValue.currentCommunity;
    if (currentCommunity?.id === selectedPost.communityId) {
      const hasPermission = checkCommunityPermission(
        currentCommunity,
        communityStateValue.mySnippets
      );

      if (!hasPermission) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to comment in this community.",
          status: "error",
        });
        setCreateLoading(false);
        return;
      }
    }

    try {
      const newComment = await createCommentAction(
        selectedPost.communityId,
        selectedPost.id!,
        selectedPost.title,
        commentText,
        parentId
      );

      setComments((prev) => [newComment, ...prev]);
      setUi((prev) =>
        prev.selectedPost
          ? {
              ...prev,
              selectedPost: {
                ...prev.selectedPost,
                numberOfComments: prev.selectedPost.numberOfComments + 1,
              },
            }
          : prev,
      );
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
