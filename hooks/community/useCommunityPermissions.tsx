import { Community } from "@/types/community";
import { auth } from "@/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";

/**
 * Calculates permission flags for the current user within a community.
 * @param communityData - Community to check against.
 * @returns Boolean flags for creator, admin, and admin-management rights.
 */
const useCommunityPermissions = (communityData?: Community) => {
  const [user] = useAuthState(auth);

  if (!communityData) {
    return { isCreator: false, isAdmin: false, canManageAdmins: false };
  }

  const isCreator = user?.uid === communityData.creatorId;
  const isAdmin =
    isCreator || communityData.adminIds?.includes(user?.uid || "");

  return {
    isCreator,
    isAdmin,
    canManageAdmins: isAdmin,
  };
};

export default useCommunityPermissions;
