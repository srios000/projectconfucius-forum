import { useState } from "react";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { Community } from "@/types/community";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";
import { joinCommunityAction } from "@/app/actions/community";

/**
 * A custom hook that provides functionality for a user to join a community.
 * It delegates the join to a server action, updates the user's membership
 * snippets, and increments the community's member count in local Jotai state.
 * @returns An object containing the `joinCommunity` function, loading state, and error state.
 */
const useJoinCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onJoinCommunity = async (communityData: Community) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    setLoading(true);
    try {
      const newSnippet = await joinCommunityAction(communityData);

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: [...prev.mySnippets, newSnippet],
        currentCommunity:
          prev.currentCommunity?.id === communityData.id
            ? {
                ...prev.currentCommunity,
                numberOfMembers: prev.currentCommunity.numberOfMembers + 1,
              }
            : prev.currentCommunity,
      }));
    } catch (error: any) {
      console.log("Error: joinCommunity", error);
      showToast({
        title: "Could not Subscribe",
        description: "There was an error subscribing to the community",
        status: "error",
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    joinCommunity: onJoinCommunity,
    joinLoading: loading,
    joinError: error,
  };
};

export default useJoinCommunity;
