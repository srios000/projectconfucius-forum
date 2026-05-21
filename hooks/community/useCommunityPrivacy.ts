import { Community } from "@/types/community";
import useCustomToast from "../useCustomToast";
import { useCommunityPrivacyMutation } from "@/lib/queries/community/use-community-privacy-mutation";

const useCommunityPrivacy = (communityData: Community) => {
  const showToast = useCustomToast();
  const mutation = useCommunityPrivacyMutation();

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await mutation.mutateAsync({ communityId: communityData.id, privacyType });
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