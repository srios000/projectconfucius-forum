import { uiAtom } from "@/atoms/uiAtom";
import { Community } from "@/types/community";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";
import { updateCommunityPrivacyAction } from "@/app/actions/community";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const useCommunityPrivacy = (communityData: Community) => {
  const setUi = useSetAtom(uiAtom);
  const queryClient = useQueryClient();
  const showToast = useCustomToast();

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await updateCommunityPrivacyAction(communityData.id, privacyType);
      setUi((prev) =>
        prev.currentCommunity?.id === communityData.id
          ? {
              ...prev,
              currentCommunity: {
                ...prev.currentCommunity,
                privacyType,
              } as Community,
            }
          : prev,
      );
      void queryClient.invalidateQueries({
        queryKey: keys.community.detail(communityData.id),
      });
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
