import { firestore } from "@/firebase/clientApp";
import { CommunitySnippet } from "@/types/community";
import { doc, increment, writeBatch } from "firebase/firestore";

/**
 * Adds a user to a community and increments the member counter.
 * Seeds admin flag when the caller already has elevated rights (creator/moderator).
 * @param userId - Auth uid joining the community.
 * @param communityId - Community id to join.
 * @param communityImageURL - Current community image url copied into the snippet.
 * @param isCreatorOrAdmin - Whether the new snippet should be marked as admin.
 * @returns Newly created community snippet for local state.
 */
export const joinCommunity = async (
  userId: string,
  communityId: string,
  communityImageURL: string,
  isCreatorOrAdmin: boolean
) => {
  const batch = writeBatch(firestore);

  const newSnippet: CommunitySnippet = {
    communityId: communityId,
    imageURL: communityImageURL || "",
    isAdmin: isCreatorOrAdmin,
  };

  batch.set(
    doc(firestore, `users/${userId}/communitySnippets`, communityId),
    newSnippet
  );

  batch.update(doc(firestore, "communities", communityId), {
    numberOfMembers: increment(1),
  });

  await batch.commit();
  return newSnippet;
};
