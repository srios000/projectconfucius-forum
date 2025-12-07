import { useState } from "react";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import { Community, CommunitySnippet } from "@/types/community";
import { auth, firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";

const useJoinCommunity = () => {
  const [user] = useAuthState(auth);
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const joinCommunity = async (communityData: Community) => {
    if (!user) return;
    setLoading(true);
    try {
      const batch = writeBatch(firestore);

      const newSnippet: CommunitySnippet = {
        communityId: communityData.id,
        imageURL: communityData.imageURL || "",
        isAdmin:
          user?.uid === communityData.creatorId ||
          communityData.adminIds?.includes(user?.uid || ""),
      };

      batch.set(
        doc(
          firestore,
          `users/${user?.uid}/communitySnippets`,
          communityData.id
        ),
        newSnippet
      );

      batch.update(doc(firestore, "communities", communityData.id), {
        numberOfMembers: increment(1),
      });

      await batch.commit();

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
    joinCommunity,
    joinLoading: loading,
    joinError: error,
  };
};

export default useJoinCommunity;
