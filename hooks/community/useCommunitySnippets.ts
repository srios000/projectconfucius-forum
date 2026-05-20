"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import useCustomToast from "../useCustomToast";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";

/**
 * A custom hook that fetches and manages the current user's community membership snippets.
 * These snippets are used to determine which communities the user has joined and their roles within them.
 * @returns An object containing the loading state and any error message encountered during fetching.
 */
export const useCommunitySnippets = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();

  const query = useCommunitySnippetsQuery();

  useEffect(() => {
    if (!user) {
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: [],
        snippetFetched: false,
      }));
      return;
    }
    if (query.data) {
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: query.data,
        snippetFetched: true,
      }));
    }
    if (query.error) {
      showToast({
        title: "Subscriptions not Found",
        description: "There was an error fetching your subscriptions",
        status: "error",
      });
    }
  }, [user, query.data, query.error, setCommunityStateValue, showToast]);

  return {
    loading: query.isLoading,
    error: query.error ? String(query.error) : "",
  };
};