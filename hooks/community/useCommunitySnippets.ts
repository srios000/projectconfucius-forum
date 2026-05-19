import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import useCustomToast from "../useCustomToast";
import { getCommunitySnippetsAction } from "@/app/actions/community";

/**
 * A custom hook that fetches and manages the current user's community membership snippets.
 * These snippets are used to determine which communities the user has joined and their roles within them.
 * @returns An object containing the loading state and any error message encountered during fetching.
 */
export const useCommunitySnippets = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const showToast = useCustomToast();

  const getMySnippets = async () => {
    setLoading(true);
    try {
      const snippets = await getCommunitySnippetsAction();
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: snippets,
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
