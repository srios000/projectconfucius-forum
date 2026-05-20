"use client";

import { uiAtom } from "@/atoms/uiAtom";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { keys } from "@/lib/queries/keys";
import { useSession } from "@/lib/auth-client";
import { Community, CommunitySnippet } from "@/types/community";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";

export interface CommunityStateValue {
  mySnippets: CommunitySnippet[];
  currentCommunity?: Community;
  snippetFetched: boolean;
}

type Updater =
  | CommunityStateValue
  | ((prev: CommunityStateValue) => CommunityStateValue);

const useCommunityState = () => {
  const [ui, setUi] = useAtom(uiAtom);
  const snippetsQuery = useCommunitySnippetsQuery();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const communityStateValue: CommunityStateValue = useMemo(
    () => ({
      mySnippets: (snippetsQuery.data ?? []) as CommunitySnippet[],
      currentCommunity: ui.currentCommunity ?? undefined,
      snippetFetched: snippetsQuery.isSuccess,
    }),
    [snippetsQuery.data, snippetsQuery.isSuccess, ui.currentCommunity],
  );

  const setCommunityStateValue = useCallback(
    (updater: Updater) => {
      const current: CommunityStateValue = {
        mySnippets: (snippetsQuery.data ?? []) as CommunitySnippet[],
        currentCommunity: ui.currentCommunity ?? undefined,
        snippetFetched: snippetsQuery.isSuccess,
      };
      const next =
        typeof updater === "function"
          ? (updater as (p: CommunityStateValue) => CommunityStateValue)(current)
          : updater;

      if (next.currentCommunity !== current.currentCommunity) {
        setUi((prev) => ({
          ...prev,
          currentCommunity: next.currentCommunity ?? null,
        }));
      }

      if (next.mySnippets !== current.mySnippets) {
        if (userId) {
          queryClient.setQueryData<CommunitySnippet[]>(
            keys.community.snippets(userId),
            next.mySnippets,
          );
        }
      }
      // snippetFetched is derived from the query — writes are ignored.
    },
    [snippetsQuery.data, snippetsQuery.isSuccess, ui.currentCommunity, setUi, queryClient, userId],
  );

  return { communityStateValue, setCommunityStateValue };
};

export default useCommunityState;
