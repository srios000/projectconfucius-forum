import { communityStateAtom } from "@/atoms/communitiesAtom";
import { CommunitySnippet } from "@/types/community";
import { auth, firestore } from "@/firebase/clientApp";
import { collection, getDocs } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";

/**
 * A custom hook that fetches and manages the current user's community membership snippets.
 * These snippets are used to determine which communities the user has joined and their roles within them.
 * @returns An object containing the loading state and any error message encountered during fetching.
 */
export const useCommunitySnippets = () => {
  const [user] = useAuthState(auth);
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const showToast = useCustomToast();

  const getMySnippets = async () => {
    setLoading(true);
    try {
      const snippetDocs = await getDocs(
        collection(firestore, `users/${user?.uid}/communitySnippets`)
      );
      const snippets = snippetDocs.docs.map((doc) => ({ ...doc.data() }));
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: snippets as CommunitySnippet[],
        snippetFetched: true,
      }));
    } catch (error: any) {
      console.log("Error: getMySnippets", error);
      setError(error.message);
      showToast({
        title: "Subscriptions not Found",
        description: "There was an error fetching your subscriptions",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: [],
        snippetFetched: false,
      }));
      return;
    }
    getMySnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { loading, error };
};
