import { useCallback } from "react";
import { useRemoveAdminMutation } from "@/lib/queries/admin/use-remove-admin-mutation";

/**
 * Shell over useRemoveAdminMutation. Preserves the `handleRemoveAdmin(
 * communityId, targetUserId)` surface.
 */
/**
 * A custom hook that provides functionality for removing a moderator from a community.
 * It delegates the demotion to a server action and updates the local admin list.
 * @returns An object containing the `handleRemoveAdmin` callback function.
 */
const useRemoveAdmin = () => {
  const mutation = useRemoveAdminMutation();

  const handleRemoveAdmin = useCallback(
    async (communityId: string, targetUserId: string) => {
      await mutation.mutateAsync({ communityId, targetUserId });
    },
    [mutation],
  );

  return { handleRemoveAdmin };
};

export default useRemoveAdmin;