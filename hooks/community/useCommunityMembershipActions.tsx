import { authModalStateAtom } from "@/atoms/authModalAtom";
import { useSetAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/clientApp";
import useJoinCommunity from "./useJoinCommunity";
import useLeaveCommunity from "./useLeaveCommunity";
import { Community } from "@/types/community";

const useCommunityMembershipActions = () => {
  const [user] = useAuthState(auth);
  const setAuthModalState = useSetAtom(authModalStateAtom);
  const { joinCommunity, joinLoading } = useJoinCommunity();
  const { leaveCommunity, leaveLoading } = useLeaveCommunity();

  const onJoinOrLeaveCommunity = (
    communityData: Community,
    isJoined: boolean
  ) => {
    if (!user) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    if (isJoined) {
      leaveCommunity(communityData.id);
      return;
    }
    joinCommunity(communityData);
  };

  return {
    onJoinOrLeaveCommunity,
    loading: joinLoading || leaveLoading,
  };
};

export default useCommunityMembershipActions;
