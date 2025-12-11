import { Dispatch, SetStateAction, useState } from "react";
import { User } from "firebase/auth";
import { postStateAtom } from "@/atoms/postsAtom";
import { Post } from "@/types/post";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";
import { createComment } from "@/lib/comments/createComment";
import useCommunityState from "../community/useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";

/**
 * Creates a new comment or reply on the selected post and updates counts.
 * Handles restricted community checks before calling Firestore.
 * @returns Comment creation handler and loading flag.
 */
const useCreateComment = (
  selectedPost: Post | null,
  setComments: Dispatch<SetStateAction<Comment[]>>
) => {
  const setPostState = useSetAtom(postStateAtom);
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);
  const { communityStateValue } = useCommunityState();

  const onCreateComment = async (
    user: User,
    commentText: string,
    parentId?: string,
    depth: number = 0
  ) => {
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
