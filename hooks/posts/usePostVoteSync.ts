"use client";

import { uiAtom } from "@/atoms/uiAtom";
import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { PostVote } from "@/types/post";
import { useCommunityPostVotesQuery } from "@/lib/queries/posts/use-post-votes";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const usePostVoteSync = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const currentCommunity = useAtomValue(uiAtom).currentCommunity;
  const communityId = currentCommunity?.id;
  const queryClient = useQueryClient();

  const { data } = useCommunityPostVotesQuery({
    communityId,
    enabled: !!user && !!communityId,
  });

  const postVotes: PostVote[] = !user || !communityId ? [] : (data ?? []);

  const setPostVotes = useCallback(
    (
      updater:
        | PostVote[]
        | ((prev: PostVote[]) => PostVote[]),
    ) => {
      if (!communityId) return;
      queryClient.setQueryData<PostVote[]>(
        keys.posts.votes(communityId),
        (old = []) =>
          typeof updater === "function"
            ? (updater as (p: PostVote[]) => PostVote[])(old)
            : updater,
      );
    },
    [queryClient, communityId],
  );

  return { postVotes, setPostVotes };
};

export default usePostVoteSync;
