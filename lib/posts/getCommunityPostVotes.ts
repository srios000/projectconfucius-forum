import { firestore } from "@/firebase/clientApp";
import { PostVote } from "@/types/post";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Retrieves all votes a user has cast within a specific community.
 * Helps hydrate vote state when browsing a single community feed.
 * @param userId - Auth uid to query under `postVotes`.
 * @param communityId - Community filter applied to votes.
 * @returns Array of vote documents with ids.
 */
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
