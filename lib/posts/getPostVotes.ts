import { firestore } from "@/firebase/clientApp";
import { PostVote } from "@/types/post";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Fetches the current user's votes for a list of posts in Firestore-friendly chunks.
 * Uses batched `in` queries to avoid exceeding Firestore limits.
 * @param userId - Auth uid whose votes should be read.
 * @param postIds - Post ids to match against.
 * @returns Array of vote documents with id and metadata.
 */
export const getPostVotes = async (userId: string, postIds: string[]) => {
  const chunks = [];
  const chunkSize = 10;
  for (let i = 0; i < postIds.length; i += chunkSize) {
    chunks.push(postIds.slice(i, i + chunkSize));
  }

  const promises = chunks.map((chunk) => {
    const postVotesQuery = query(
      collection(firestore, `users/${userId}/postVotes`),
      where("postId", "in", chunk)
    );
    return getDocs(postVotesQuery);
  });

  const querySnapshots = await Promise.all(promises);

  const postVotes = querySnapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  );

  return postVotes as PostVote[];
};
