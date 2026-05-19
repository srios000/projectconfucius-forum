import { AdminUser } from "@/types/adminUser";
import { removeAdminAction } from "@/app/actions/admin";
import { Dispatch, SetStateAction, useCallback } from "react";

/**
 * A custom hook that provides functionality for removing a moderator from a community.
 * It delegates the demotion to a server action and updates the local admin list.
 * @returns An object containing the `handleRemoveAdmin` callback function.
 */
const useRemoveAdmin = () => {
  const handleRemoveAdmin = useCallback(
    async (
      communityId: string,
      userId: string,
      updateAdmins?: Dispatch<SetStateAction<AdminUser[]>>
    ) => {
      await removeAdminAction(communityId, userId);

      if (updateAdmins) {
        updateAdmins((prev) => prev.filter((admin) => admin.uid !== userId));
      }
    },
    []
  );

  return { handleRemoveAdmin };
};

export default useRemoveAdmin;
