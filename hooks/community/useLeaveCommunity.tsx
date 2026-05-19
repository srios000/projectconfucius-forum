import { useState } from "react";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";
import { leaveCommunityAction } from "@/app/actions/community";

/**
 * A custom hook that provides functionality for a user to leave a community.
 * It delegates the leave to a server action, removes the user's membership
 * snippet, and decrements the community's member count in local Jotai state.
 * @returns An object containing the `leaveCommunity` function, loading state, and error state.
 */
const useLeaveCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLeaveCommunity = async (communityId: string) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    setLoading(true);
    try {
      await leaveCommunityAction(communityId);

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.filter(
          (item) => item.communityId !== communityId
        ),
        currentCommunity:
          prev.currentCommunity?.id === communityId
            ? {
                ...prev.currentCommunity,
                numberOfMembers: prev.currentCommunity.numberOfMembers - 1,
              }
            : prev.currentCommunity,
      }));
    } catch (error: any) {
      console.log("Error: leaveCommunity", error.message);
      setError(error.message);
      showToast({
        title: "Could not Unsubscribe",
        description: "There was an error unsubscribing from the community",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    leaveCommunity: onLeaveCommunity,
    leaveLoading: loading,
    leaveError: error,
  };
};

export default useLeaveCommunity;
