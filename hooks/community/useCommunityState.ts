"use client";

import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { CommunitySnippet } from "@/types/community";
import { useMemo } from "react";

export interface CommunityStateValue {
  mySnippets: CommunitySnippet[];
  snippetFetched: boolean;
}

const useCommunityState = () => {
  const snippetsQuery = useCommunitySnippetsQuery();
  const communityStateValue: CommunityStateValue = useMemo(
    () => ({
      mySnippets: (snippetsQuery.data ?? []) as CommunitySnippet[],
      snippetFetched: snippetsQuery.isSuccess,
    }),
    [snippetsQuery.data, snippetsQuery.isSuccess],
  );
  return { communityStateValue };
};

export default useCommunityState;
