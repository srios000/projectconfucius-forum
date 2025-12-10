import { firestore } from "@/firebase/clientApp";
import { PostVote } from "@/types/post";
import { collection, getDocs, query, where } from "firebase/firestore";

export const getCommunityPostVotes = async (
  userId: string,
  communityId: string
) => {
  const postVotesQuery = query(
    collection(firestore, "users", `${userId}/postVotes`),
    where("communityId", "==", communityId)
  );

  const postVoteDocs = await getDocs(postVotesQuery);
  const postVotes = postVoteDocs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PostVote[];
  return postVotes;
};
