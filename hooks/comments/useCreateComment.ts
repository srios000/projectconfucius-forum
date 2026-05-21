import { useState } from "react";
import { uiAtom } from "@/atoms/uiAtom";
import { Post } from "@/types/post";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import useCommunityState from "../community/useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";

/**
 * Shell over useCreateCommentMutation. Preserves the public `createComment` /
 * `createLoading` surface. Permission gating, toasts, and bumping the
 * selectedPost comment count in uiAtom stay here. The numberOfComments bump
 * is a best-effort UI mirror for the post header; the canonical count
 * refreshes via posts.detail invalidation.
 */
/**
 * A custom hook that provides functionality for creating new comments and replies.
 * It handles permission checks for restricted communities and updates the local
 * post state to reflect the new comment count. Comment depth is derived
 * server-side from the parent.
 * @param selectedPost - The post being commented on.
 * @param setComments - A state setter function to update the local comments list.
 * @returns An object containing the `onCreateComment` function and a loading state indicator.
 */
const useCreateComment = (selectedPost: Post | null) => {
  const setUi = useSetAtom(uiAtom);
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);
  const { communityStateValue } = useCommunityState();
  const mutation = useCreateCommentMutation();

  const onCreateComment = async (commentText: string, parentId?: string) => {
    if (!selectedPost) return;
    setCreateLoading(true);

    const currentCommunity = communityStateValue.currentCommunity;
    if (currentCommunity?.id === selectedPost.communityId) {
      const hasPermission = checkCommunityPermission(
        currentCommunity,
        communityStateValue.mySnippets,
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
      await mutation.mutateAsync({
        communityId: selectedPost.communityId,
        postId: selectedPost.id!,
        postTitle: selectedPost.title,
        commentText,
        parentId,
      });
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
        description: error.message || "There was an error creating your comment",
        status: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return { createComment: onCreateComment, createLoading };
};

export default useCreateComment;