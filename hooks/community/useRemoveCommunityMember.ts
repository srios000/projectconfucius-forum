import useCustomToast from "../useCustomToast";
import { useRemoveCommunityMemberMutation } from "@/lib/queries/community/use-remove-community-member-mutation";

/**
 * Shell over useRemoveCommunityMemberMutation. Preserves the `{ removeMember,
 * loading }` surface and the success/failure toasts.
 */
/**
 * A custom hook that provides functionality for an administrator to remove a member from a community.
 * It handles the backend removal logic and provides feedback via toast notifications.
 * @returns An object containing the `removeMember` function and a loading state indicator.
 */
const useRemoveCommunityMember = () => {
  const showToast = useCustomToast();
  const mutation = useRemoveCommunityMemberMutation();

  const removeMember = async (communityId: string, memberId: string) => {
    try {
      await mutation.mutateAsync({ communityId, memberId });
      showToast({
        title: "User removed",
        description: "The user has been removed from the community.",
        status: "success",
      });
      return true;
    } catch (error: any) {
      console.error("Error removing member", error);
      showToast({
        title: "Error removing member",
        description: error.message,
        status: "error",
      });
      return false;
    }
  };

  return { removeMember, loading: mutation.isPending };
};

export default useRemoveCommunityMember;