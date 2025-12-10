import { firestore } from "@/firebase/clientApp";
import { Post, PostVote } from "@/types/post";
import { collection, doc, writeBatch } from "firebase/firestore";

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
