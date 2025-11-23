/* eslint-disable react-hooks/exhaustive-deps */
import { authModalStateAtom } from "@/atoms/authModalAtom";
import {
  Community,
  CommunitySnippet,
  communityStateAtom,
} from "@/atoms/communitiesAtom";
import { auth, firestore } from "@/firebase/clientApp";
import { doc, getDoc, increment, writeBatch } from "firebase/firestore";
import { useAtom, useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "./useCustomToast";

/**
 * Checks whether a user is subscribed to a community.
 * Contains the current community state (`communitiesState`).
 * Contains functionality to subscribe or unsubscribe to a community.
 *
 * @returns {Community} currentCommunity - object containing the current community state, including the user's community snippets
 * @returns {() => void} onJoinOrLeaveCommunity - function that handles subscribing or unsubscribing a community
 * @returns {boolean} loading - indicates whether a community operation is currently in progress
 */
const useCommunityData = () => {
  const [user] = useAuthState(auth);
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuthModalState = useSetAtom(authModalStateAtom);
  const params = useParams();
  const showToast = useCustomToast();

  /**
   * Handles the user subscribing or unsubscribing to a community.
   * If the user is not currently authenticated, the authentication modal is opened.
   * If the user is already subscribed, then the function will unsubscribe the user from the community.
   * If the user is not subscribed, then the function will subscribe the user to the community.
   * @param {Community} communityData - object is an object representing the community being joined or left
   * @param {boolean} isJoined - indicates whether the user is currently a member of the community
   */
  const onJoinOrLeaveCommunity = (
    communityData: Community,
    isJoined: boolean
  ) => {
    // open the authentication modal if the user is not logged in
    if (!user) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    setLoading(true);

    if (isJoined) {
      leaveCommunity(communityData.id);
      return;
    }
    joinCommunity(communityData);

    setLoading(false);
  };

  /**
   * Subscribes the currently authenticated user to the community.
   *
   * @param communityData (Community) - community to which the user is subscribed to
   * @throws error - error in subscribing to a community
   */
  const joinCommunity = async (communityData: Community) => {
    try {
      const batch = writeBatch(firestore);

      // creates a new snippet representing the subscription (from current page)
      const newSnippet: CommunitySnippet = {
        communityId: communityData.id, // community id from the current community page
        imageURL: communityData.imageURL || "", // community image from the current community page
        // if the creator of community re-subscribes to the community
        isAdmin:
          user?.uid === communityData.creatorId ||
          communityData.adminIds?.includes(user?.uid || ""),
      };

      // create a new community snippet into the user document (subscription)
      batch.set(
        doc(
          firestore,
          `users/${user?.uid}/communitySnippets`,
          communityData.id
        ),
        newSnippet
      );

      // updating the number of members
      batch.update(doc(firestore, "communities", communityData.id), {
        numberOfMembers: increment(1),
      });

      await batch.commit();
      // update state to update the UI
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
    }
    setLoading(false);
  };

  /**
   * Unsubscribes the currently authenticated user from the community
   * @param {string} communityId - community from which the user is unsubscribed from
   *
   * @async
   *
   * @throws {any} error - error in subscribing to a community
   */
  const leaveCommunity = async (communityId: string) => {
    try {
      const batch = writeBatch(firestore);

      // delete new community snippet
      batch.delete(
        doc(firestore, `users/${user?.uid}/communitySnippets`, communityId)
      );

      // updating the number of members
      batch.update(doc(firestore, "communities", communityId), {
        numberOfMembers: increment(-1),
      });

      await batch.commit();

      // update state to update the UI
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
    }
    setLoading(false);
  };

  return {
    communityStateValue,
    onJoinOrLeaveCommunity,
    loading,
  };
};

export default useCommunityData;
