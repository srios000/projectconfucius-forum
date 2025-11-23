import { Community } from "@/atoms/communitiesAtom";
import { auth } from "@/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";

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
