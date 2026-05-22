import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post } from "@/types/post";
import { getCommunityDataAction } from "@/app/actions/reads";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";
import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import type { Community } from "@/types/community";

const usePostVote = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const qc = useQueryClient();
  const snippets = useCommunitySnippetsQuery();
  const mySnippets = snippets.data ?? [];
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
    communityId: string | null,
  ) => {
    event.stopPropagation();
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    if (communityId) {
      const isMember = !!mySnippets.find((s) => s.communityId === communityId);
      if (!isMember) {
        let community = qc.getQueryData<Community>(keys.community.detail(communityId));
        if (!community) {
          try {
            community = (await qc.fetchQuery({
              queryKey: keys.community.detail(communityId),
              queryFn: () => getCommunityDataAction(communityId),
            })) ?? undefined;
          } catch (error) {
            console.log("Error fetching community data for vote permission", error);
          }
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
