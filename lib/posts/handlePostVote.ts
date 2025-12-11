import { firestore } from "@/firebase/clientApp";
import { Post, PostVote } from "@/types/post";
import { collection, doc, writeBatch } from "firebase/firestore";

/**
 * Applies an upvote or downvote for a post and updates aggregate vote counts.
 * Handles new votes, toggling existing votes, and switching directions in a single batch.
 * @param userId - Auth uid performing the vote.
 * @param post - Post being voted on with current voteStatus.
 * @param vote - Either 1 or -1 representing the intent.
 * @param communityId - Community id used for vote metadata.
 * @param existingVote - Prior vote from this user, if any.
 * @returns Vote change delta, new/updated vote record, and any deleted vote id for local state.
 */
export const handlePostVote = async (
  userId: string,
  post: Post,
  vote: number,
  communityId: string,
  existingVote?: PostVote
) => {
  const batch = writeBatch(firestore);
  let voteChange = vote;
  let newVote: PostVote | undefined;
  let voteIdToDelete: string | undefined;

  if (!existingVote) {
    const postVoteRef = doc(
      collection(firestore, "users", `${userId}/postVotes`)
    );
    newVote = {
      id: postVoteRef.id,
      postId: post.id!,
      communityId,
      voteValue: vote,
    };

    batch.set(postVoteRef, newVote);
    voteChange = vote;
  } else {
    const postVoteRef = doc(
      firestore,
      "users",
      `${userId}/postVotes/${existingVote.id}`
    );

    if (existingVote.voteValue === vote) {
      batch.delete(postVoteRef);
      voteChange = -vote;
      voteIdToDelete = existingVote.id;
    } else {
      batch.update(postVoteRef, {
        voteValue: vote,
      });
      voteChange = 2 * vote;
      newVote = {
        ...existingVote,
        voteValue: vote,
      };
    }
  }

  const postRef = doc(firestore, "posts", post.id!);
  batch.update(postRef, { voteStatus: post.voteStatus + voteChange });
  await batch.commit();

  return { voteChange, newVote, voteIdToDelete };
};
