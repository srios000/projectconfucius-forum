import { firestore } from "@/firebase/clientApp";
import { arrayRemove, doc, getDoc, writeBatch } from "firebase/firestore";

/**
 * Removes a user as an admin from a community.
 * Keeps them as a member but removes admin privileges.
 * @param communityId - The community ID
 * @param userId - The user ID to remove as admin
 * @returns Promise<void>
 */
export const removeCommunityAdmin = async (
  communityId: string,
  userId: string
): Promise<void> => {
  const snippetRef = doc(
    firestore,
    `users/${userId}/communitySnippets/${communityId}`
  );
  const snippetDoc = await getDoc(snippetRef);

  const batch = writeBatch(firestore);
  const communityRef = doc(firestore, "communities", communityId);

  batch.update(communityRef, {
    adminIds: arrayRemove(userId),
  });

  if (snippetDoc.exists()) {
    batch.update(snippetRef, {
      isAdmin: false,
    });
  }

  await batch.commit();
};
