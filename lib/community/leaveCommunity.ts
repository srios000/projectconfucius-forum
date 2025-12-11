import { firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";

/**
 * Removes a user's snippet from a community and decrements membership count.
 * @param userId - Auth uid leaving the community.
 * @param communityId - Community id to leave.
 * @returns Resolves after the batch write completes.
 */
export const leaveCommunity = async (userId: string, communityId: string) => {
  const batch = writeBatch(firestore);

  batch.delete(
    doc(firestore, `users/${userId}/communitySnippets`, communityId)
  );

  batch.update(doc(firestore, "communities", communityId), {
    numberOfMembers: increment(-1),
  });

  await batch.commit();
};
