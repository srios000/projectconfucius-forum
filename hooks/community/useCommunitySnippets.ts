"use client";

import { useEffect } from "react";
import useCustomToast from "../useCustomToast";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";

export const useCommunitySnippets = () => {
  const showToast = useCustomToast();
  const query = useCommunitySnippetsQuery();

  useEffect(() => {
    if (query.error) {
      showToast({
        title: "Subscriptions not Found",
        description: "There was an error fetching your subscriptions",
        status: "error",
      });
    }
  }, [query.error, showToast]);

  return {
    loading: query.isLoading,
    error: query.error ? String(query.error) : "",
  };
};
