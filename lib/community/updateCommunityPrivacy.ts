import { firestore } from "@/firebase/clientApp";
import { doc, updateDoc } from "firebase/firestore";

/**
 * Updates the privacy setting for a community document.
 * Used by admins to toggle between public, restricted, and private.
 * @param communityId - Target community id.
 * @param privacyType - New privacy value to store.
 * @returns Resolves once the document is updated.
 */
export const updateCommunityPrivacy = async (
  communityId: string,
  privacyType: string
) => {
  await updateDoc(doc(firestore, "communities", communityId), {
    privacyType,
  });
};
