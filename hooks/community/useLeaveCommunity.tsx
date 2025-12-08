import { useState } from "react";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { auth, firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";

/**
 * Removes the current user from a community and decrements its member count.
 * @param communityId - Community id to leave.
 * @returns Leave handler plus loading and error state.
 */
const useLeaveCommunity = () => {
  const [user] = useAuthState(auth);
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const leaveCommunity = async (communityId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const batch = writeBatch(firestore);

      batch.delete(
        doc(firestore, `users/${user?.uid}/communitySnippets`, communityId)
      );

      batch.update(doc(firestore, "communities", communityId), {
        numberOfMembers: increment(-1),
      });

      await batch.commit();

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
    leaveCommunity,
    leaveLoading: loading,
    leaveError: error,
  };
};

export default useLeaveCommunity;
