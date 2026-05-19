import { AdminUser } from "@/types/adminUser";
import { addAdminAction } from "@/app/actions/admin";
import { Dispatch, SetStateAction, useCallback } from "react";

/**
 * A custom hook that provides functionality for adding a new moderator to a community.
 * It delegates the promotion to a server action and updates the local admin list.
 * @returns An object containing the `handleAddAdmin` callback function.
 */
const useAddAdmin = () => {
  const handleAddAdmin = useCallback(
    async (
      communityId: string,
      newUser: AdminUser,
      _communityImageURL?: string,
      updateAdmins?: Dispatch<SetStateAction<AdminUser[]>>
    ) => {
      await addAdminAction(communityId, newUser.uid);

      if (updateAdmins) {
        updateAdmins((prev) => [...prev, newUser]);
      }
    },
    []
  );

  return { handleAddAdmin };
};

export default useAddAdmin;
