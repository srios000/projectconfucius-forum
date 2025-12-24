import { communityStateAtom } from "@/atoms/communitiesAtom";
import { AdminUser } from "@/types/adminUser";
import { removeCommunityAdmin } from "@/lib/community/removeCommunityAdmin";
import { useSetAtom } from "jotai";
import { Dispatch, SetStateAction, useCallback } from "react";
import { Community } from "@/types/community";

/**
 * A custom hook that provides functionality for removing an administrator from a community.
 * It handles the backend demotion logic and synchronizes the local Jotai state to reflect the change.
 * @returns An object containing the `handleRemoveAdmin` callback function.
 */
const useRemoveAdmin = () => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);

  const handleRemoveAdmin = useCallback(
    async (
      communityId: string,
      userId: string,
      updateAdmins?: Dispatch<SetStateAction<AdminUser[]>>
    ) => {
      await removeCommunityAdmin(communityId, userId);

      if (updateAdmins) {
        updateAdmins((prev) => prev.filter((admin) => admin.uid !== userId));
      }

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity!,
          adminIds: (prev.currentCommunity?.adminIds || []).filter(
            (id) => id !== userId
          ),
        } as Community,
      }));
    },
    [setCommunityStateValue]
  );

  return { handleRemoveAdmin };
};

export default useRemoveAdmin;
