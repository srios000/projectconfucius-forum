import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { AdminUser, addCommunityAdmin } from "@/lib/communityAdmins";
import { useSetAtom } from "jotai";
import { Dispatch, SetStateAction, useCallback } from "react";

const useAddAdmin = () => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);

  const handleAddAdmin = useCallback(
    async (
      communityId: string,
      newUser: AdminUser,
      communityImageURL?: string,
      updateAdmins?: Dispatch<SetStateAction<AdminUser[]>>
    ) => {
      await addCommunityAdmin(communityId, newUser.uid, communityImageURL);

      if (updateAdmins) {
        updateAdmins((prev) => [...prev, newUser]);
      }

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity!,
          adminIds: [...(prev.currentCommunity?.adminIds || []), newUser.uid],
        } as Community,
      }));
    },
    [setCommunityStateValue]
  );

  return { handleAddAdmin };
};

export default useAddAdmin;
