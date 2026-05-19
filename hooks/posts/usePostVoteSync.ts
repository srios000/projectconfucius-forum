import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useAtomValue } from "jotai";
import React, { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Post, PostVote } from "@/types/post";
import { getCommunityPostVotesAction } from "@/app/actions/posts";

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

  const getCommunityPostVotes = async (communityId: string) => {
    if (!user) return;
    const postVotes = await getCommunityPostVotesAction(communityId);
    setPostStateValue((prev) => ({
      ...prev,
      postVotes: postVotes as PostVote[],
    }));
  };

  useEffect(() => {
    if (!user || !currentCommunity?.id) {
      return;
    }
    getCommunityPostVotes(currentCommunity?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentCommunity]);

  useEffect(() => {
    if (!user) {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
    }
  }, [user, setPostStateValue]);
};

export default usePostVoteSync;
