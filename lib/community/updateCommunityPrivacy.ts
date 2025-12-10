import { firestore } from "@/firebase/clientApp";
import { doc, updateDoc } from "firebase/firestore";

export const updateCommunityPrivacy = async (
  communityId: string,
  privacyType: string
) => {
  await updateDoc(doc(firestore, "communities", communityId), {
    privacyType,
  });
};
