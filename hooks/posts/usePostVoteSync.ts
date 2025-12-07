import { communityStateAtom } from "@/atoms/communitiesAtom";
import { Post, PostVote } from "@/atoms/postsAtom";
import { firestore } from "@/firebase/clientApp";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAtomValue } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/clientApp";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

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
