import { useCallback } from "react";
import { useAddAdminMutation } from "@/lib/queries/admin/use-add-admin-mutation";

/**
 * Shell over useAddAdminMutation. Preserves the `handleAddAdmin(communityId,
 * targetUserId)` surface. Invalidation of community.admins refreshes the
 * AdminManager view via useCommunityAdminsListQuery.
 */
/**
 * A custom hook that provides functionality for adding a new moderator to a community.
 * It delegates the promotion to a server action and updates the local admin list.
 * @returns An object containing the `handleAddAdmin` callback function.
 */
const useAddAdmin = () => {
  const mutation = useAddAdminMutation();

  const handleAddAdmin = useCallback(
    async (communityId: string, targetUserId: string) => {
      await mutation.mutateAsync({ communityId, targetUserId });
    },
    [mutation],
  );

  return { handleAddAdmin };
};

export default useAddAdmin;