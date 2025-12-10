import { communityStateAtom } from "@/atoms/communitiesAtom";
import { Community } from "@/types/community";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";
import { updateCommunityPrivacy } from "@/lib/community/updateCommunityPrivacy";

/**
 * Updates a community's privacy type and mirrors the change in local state.
 * @param communityData - Community whose privacy setting is being changed.
 * @returns Handler that writes the new privacy type to Firestore.
 */
const useCommunityPrivacy = (communityData: Community) => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await updateCommunityPrivacy(communityData.id, privacyType);
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
