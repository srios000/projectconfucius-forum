import { communityStateAtom } from "@/atoms/communitiesAtom";
import { firestore } from "@/firebase/clientApp";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAtomValue } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/clientApp";
import { Post, PostVote } from "@/types/post";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

/**
 * Keeps the local post vote cache in sync with the signed-in user's community votes.
 * @param setPostStateValue - Setter for the post atom to store fetched votes.
 * @returns Subscribes to auth and community changes to refresh vote data.
 */
const usePostVoteSync = (setPostStateValue: SetPostState) => {
  const [user] = useAuthState(auth);
  const currentCommunity = useAtomValue(communityStateAtom).currentCommunity;

  const getCommunityPostVotes = async (communityId: string) => {
    const postVotesQuery = query(
      collection(firestore, "users", `${user?.uid}/postVotes`),
      where("communityId", "==", communityId)
    );

    const postVoteDocs = await getDocs(postVotesQuery);
    const postVotes = postVoteDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
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
