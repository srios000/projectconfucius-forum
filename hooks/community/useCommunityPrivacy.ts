import { communityStateAtom } from "@/atoms/communitiesAtom";
import { Community } from "@/types/community";
import { firestore } from "@/firebase/clientApp";
import { doc, updateDoc } from "firebase/firestore";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";

const useCommunityPrivacy = (communityData: Community) => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await updateDoc(doc(firestore, "communities", communityData.id), {
        privacyType,
      });
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          privacyType: privacyType,
        } as Community,
      }));
    } catch (error) {
      console.log("Error: onUpdateCommunityPrivacyType", error);
      showToast({
        title: "Privacy Type not Updated",
        description: "There was an error updating the community privacy type",
        status: "error",
      });
    }
  };

  return { updatePrivacyType };
};

export default useCommunityPrivacy;
