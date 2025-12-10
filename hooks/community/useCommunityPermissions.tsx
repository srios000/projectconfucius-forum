import { Community } from "@/types/community";
import { auth } from "@/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import useCommunityState from "./useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";

/**
 * Calculates permission flags for the current user within a community.
 * @param communityData - Community to check against.
 * @returns Boolean flags for creator, admin, admin-management rights, posting, and commenting.
 */
const useCommunityPermissions = (communityData?: Community) => {
  const [user] = useAuthState(auth);
  const { communityStateValue } = useCommunityState();

  if (!communityData) {
    return {
      isCreator: false,
      isAdmin: false,
      canManageAdmins: false,
      canPost: false,
      canComment: false,
    };
  }

  const isCreator = user?.uid === communityData.creatorId;
  const isAdmin =
    isCreator || communityData.adminIds?.includes(user?.uid || "");

  const hasPermission = checkCommunityPermission(
    communityData,
    communityStateValue.mySnippets
  );

  return {
    isCreator,
    isAdmin,
    canManageAdmins: isAdmin,
    canPost: hasPermission,
    canComment: hasPermission,
  };
};

export default useCommunityPermissions;
