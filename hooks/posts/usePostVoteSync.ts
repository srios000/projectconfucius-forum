"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSession } from "@/lib/auth-client";
import { Post, PostVote } from "@/types/post";
import { useCommunityPostVotesQuery } from "@/lib/queries/posts/use-post-votes";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

/**
 * A custom hook that synchronizes the local post vote cache with the authenticated user's votes for the current community.
 * It automatically fetches votes when the user or the current community changes.
 * @param setPostStateValue - A state setter function to update the global post state with fetched votes.
 * @returns This hook does not return any values; it performs synchronization as a side effect.
 */
const usePostVoteSync = (setPostStateValue: SetPostState) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const currentCommunity = useAtomValue(communityStateAtom).currentCommunity;
  const communityId = currentCommunity?.id;

  const { data: postVotes } = useCommunityPostVotesQuery({
    communityId,
    enabled: !!user && !!communityId,
  });

  useEffect(() => {
    setPostStateValue((prev) => ({
      ...prev,
      postVotes: !user || !communityId ? [] : (postVotes ?? []),
    }));
  }, [user, communityId, postVotes, setPostStateValue]);
};

export default usePostVoteSync;