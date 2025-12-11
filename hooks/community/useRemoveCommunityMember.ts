import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { removeCommunityMember } from "@/lib/community/removeCommunityMember";

/**
 * Hook to remove a member from a community.
 * Used by admins to unsubscribe users.
 * @returns Removal handler and loading flag.
 */
const useRemoveCommunityMember = () => {
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);

  const removeMember = async (communityId: string, memberId: string) => {
    setLoading(true);
    try {
      await removeCommunityMember(communityId, memberId);
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
    } finally {
      setLoading(false);
    }
  };

  return { removeMember, loading };
};

export default useRemoveCommunityMember;
