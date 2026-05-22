import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { useCommentVoteMutation } from "@/lib/queries/comments/use-comment-vote";
import { useMutationState } from "@tanstack/react-query";

const useCommentVote = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const voteMutation = useCommentVoteMutation();

  const pendingVars = useMutationState<{ commentId: string }>({
    filters: { mutationKey: ["comments", "vote"], status: "pending" },
    select: (m) => ({ commentId: (m.state.variables as any)?.commentId }),
  });
  const isVotePending = (commentId: string) => pendingVars.some((v) => v.commentId === commentId);

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    commentId: string,
    postId: string,
    vote: number,
    existingVoteValue?: number
  ) => {
    event.stopPropagation();
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }

    try {
      await voteMutation.mutateAsync({ commentId, postId, vote, existingVoteValue });
    } catch (error) {
      console.log("Error: onVote", error);
      showToast({
        title: "Could not Vote",
        description: "There was an error voting on the comment",
        status: "error",
      });
    }
  };

  return { onVote, isVotePending };
};

export default useCommentVote;
