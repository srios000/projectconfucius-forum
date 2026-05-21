import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post, PostVote } from "@/types/post";
import { getCommunityDataAction } from "@/app/actions/reads";
import useCommunityState from "../community/useCommunityState";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";
import { useMutationState } from "@tanstack/react-query";

const usePostVote = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const { communityStateValue } = useCommunityState();
  const voteMutation = usePostVoteMutation();

  const pendingVars = useMutationState<{ postId: string }>({
    filters: { mutationKey: ["posts", "vote"], status: "pending" },
    select: (m) => ({ postId: (m.state.variables as any)?.post?.id }),
  });
  const isVotePending = (postId: string) => pendingVars.some((v) => v.postId === postId);

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string,
  ) => {
    event.stopPropagation();
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    const isMember = !!communityStateValue.mySnippets.find((s) => s.communityId === communityId);
    if (!isMember) {
      let community = communityStateValue.currentCommunity;
      if (!community || community.id !== communityId) {
        try { community = (await getCommunityDataAction(communityId)) ?? undefined; }
        catch (error) { console.log("Error fetching community data for vote permission", error); }
      }
      if (community && (community.privacyType === "restricted" || community.privacyType === "private")) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to vote in this community.",
          status: "error",
        });
        return;
      }
    }

    try {
      await voteMutation.mutateAsync({ post, vote, communityId });
    } catch (error) {
      console.log("Error: onVote", error);
      showToast({
        title: "Could not Vote",
        description: "There was an error voting on the post",
        status: "error",
      });
    }
  };

  return { onVote, isVotePending };
};

export default usePostVote;