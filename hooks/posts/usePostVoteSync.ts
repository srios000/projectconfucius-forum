"use client";

import { uiAtom } from "@/atoms/uiAtom";
import { useAtomValue } from "jotai";
import { useSession } from "@/lib/auth-client";
import type { PostVote } from "@/types/post";
import { useCommunityPostVotesQuery } from "@/lib/queries/posts/use-post-votes";

const usePostVoteSync = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const currentCommunity = useAtomValue(uiAtom).currentCommunity;
  const communityId = currentCommunity?.id;

  const { data } = useCommunityPostVotesQuery({
    communityId,
    enabled: !!user && !!communityId,
  });

  const postVotes: PostVote[] = !user || !communityId ? [] : (data ?? []);
  return { postVotes };
};

export default usePostVoteSync;
