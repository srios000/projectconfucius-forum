import { firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";

/**
 * Removes a user from a community by deleting their snippet and decrementing the member count.
 * @param communityId - The ID of the community.
 * @param memberId - The ID of the user to remove.
 */
export const removeCommunityMember = async (
  communityId: string,
  memberId: string
) => {
  try {
    const batch = writeBatch(firestore);

    // Delete the user's community snippet
    batch.delete(
      doc(firestore, `users/${memberId}/communitySnippets`, communityId)
    );

    // Decrement the community member count
    batch.update(doc(firestore, "communities", communityId), {
      numberOfMembers: increment(-1),
    });

    await batch.commit();
  } catch (error) {
    console.error("Error removing community member", error);
    throw error;
  }
};
