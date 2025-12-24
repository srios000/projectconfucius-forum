import { Community } from "@/types/community";
import { auth } from "@/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import useCommunityState from "./useCommunityState";
import {
  checkCommunityPermission,
  checkCommunityViewPermission,
} from "@/lib/community/communityPermissions";

/**
 * A custom hook that calculates various permission flags for the current user within a specific community.
 * It determines if the user is the creator, an admin, and whether they have rights to post, comment, or view the community.
 * @param communityData - The community object to check permissions against.
 * @returns An object containing boolean permission flags and a loading state indicator.
 */
const useCommunityPermissions = (communityData?: Community) => {
  const [user, loadingUser] = useAuthState(auth);
  const { communityStateValue } = useCommunityState();

  const loading =
    loadingUser || (!!user && !communityStateValue.snippetFetched);

  if (!communityData) {
    return {
      isCreator: false,
      isAdmin: false,
      canManageAdmins: false,
      canPost: false,
      canComment: false,
      canView: false,
      loading,
    };
  }

  const isCreator = user?.uid === communityData.creatorId;
  const isAdmin =
    isCreator || communityData.adminIds?.includes(user?.uid || "");

  const hasPermission = checkCommunityPermission(
    communityData,
    communityStateValue.mySnippets
  );

  const canView = checkCommunityViewPermission(
    communityData,
    communityStateValue.mySnippets
  );

  return {
    isCreator,
    isAdmin,
    canManageAdmins: isAdmin,
    canPost: hasPermission,
    canComment: hasPermission,
    canView,
    loading,
  };
};

export default useCommunityPermissions;
