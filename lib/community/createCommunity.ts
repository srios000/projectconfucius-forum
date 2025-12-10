import { firestore } from "@/firebase/clientApp";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

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
