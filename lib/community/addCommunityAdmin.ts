import { firestore } from "@/firebase/clientApp";
import { arrayUnion, doc, increment, runTransaction } from "firebase/firestore";

/**
 * Adds a user as an admin to a community.
 * Creates a community snippet for the user if they aren't a member yet.
 * @param communityId - The community ID
 * @param userId - The user ID to make admin
 * @param communityImageURL - The community image URL (for snippet creation)
 * @returns Promise<void>
 */
export const addCommunityAdmin = async (
  communityId: string,
  userId: string,
  communityImageURL?: string
): Promise<void> => {
  await runTransaction(firestore, async (transaction) => {
    const communityRef = doc(firestore, "communities", communityId);
    const snippetRef = doc(
      firestore,
      `users/${userId}/communitySnippets/${communityId}`
    );

    const snippetDoc = await transaction.get(snippetRef);

    transaction.update(communityRef, {
      adminIds: arrayUnion(userId),
    });

    if (snippetDoc.exists()) {
      transaction.update(snippetRef, {
        isAdmin: true,
      });
    } else {
      transaction.set(snippetRef, {
        communityId: communityId,
        imageURL: communityImageURL || "",
        isAdmin: true,
      });

      transaction.update(communityRef, {
        numberOfMembers: increment(1),
      });
    }
  });
};
