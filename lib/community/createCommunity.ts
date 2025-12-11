import { firestore } from "@/firebase/clientApp";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

/**
 * Creates a new community document and the creator's membership snippet in a single transaction.
 * Rejects when a community with the same id already exists.
 * @param communityName - Desired community id used across routes and documents.
 * @param communityType - Privacy setting applied on creation.
 * @param userId - Auth uid creating the community and seeded as first member.
 * @returns Resolves when both documents are written.
 * @see https://firebase.google.com/docs/firestore/manage-data/transactions
 */
export const createCommunity = async (
  communityName: string,
  communityType: string,
  userId: string
) => {
  const communityDocRef = doc(firestore, "communities", communityName);

  await runTransaction(firestore, async (transaction) => {
    const communityDoc = await transaction.get(communityDocRef);
    if (communityDoc.exists()) {
      throw new Error(`Sorry, /r/${communityName} is taken. Try another.`);
    }

    // create community
    transaction.set(communityDocRef, {
      creatorId: userId,
      createdAt: serverTimestamp(),
      numberOfMembers: 1,
      privacyType: communityType,
    });

    // create community snippet on user
    transaction.set(
      doc(firestore, `users/${userId}/communitySnippets`, communityName),
      {
        communityId: communityName,
        isModerator: true,
      }
    );
  });
};
