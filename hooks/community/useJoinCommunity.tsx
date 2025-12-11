import { useState } from "react";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { Community } from "@/types/community";
import { auth } from "@/firebase/clientApp";
import { useSetAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";
import { joinCommunity } from "@/lib/community/joinCommunity";

/**
 * Adds the current user to a community and updates member counts and snippets.
 * @returns Join handler plus loading and error state.
 */
const useJoinCommunity = () => {
  const [user] = useAuthState(auth);
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onJoinCommunity = async (communityData: Community) => {
    if (!user) return;
    setLoading(true);
    try {
      const newSnippet = await joinCommunity(
        user.uid,
        communityData.id,
        communityData.imageURL || "",
        user.uid === communityData.creatorId ||
          (communityData.adminIds?.includes(user.uid || "") ?? false)
      );

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
