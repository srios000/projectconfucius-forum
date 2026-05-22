"use client";

import useCustomToast from "@/hooks/useCustomToast";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Community } from "@/types/community";
import { getCommunitiesAction } from "@/app/actions/reads";
import type { CommunityCursor, CommunitySort } from "@/lib/community/getCommunities";
import { keys } from "@/lib/queries/keys";

type UseCommunitiesFeedProps = {
  limitValue?: number;
  isPagination?: boolean;
  sort?: CommunitySort;
};

/**
 * A custom hook that manages the community discovery feed.
 * It handles paginated fetching of communities and supports infinite scrolling.
 * @param limitValue - The number of communities to fetch per request.
 * @param isPagination - Whether to enable pagination for the feed.
 * @returns An object containing the communities list, loading state, and a function to fetch more communities.
 */
const useCommunitiesFeed = ({
  limitValue = 10,
  isPagination = false,
  sort = "recent",
}: UseCommunitiesFeedProps) => {
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [lastVisible, setLastVisible] = useState<CommunityCursor>(null);
  const [noMoreCommunities, setNoMoreCommunities] = useState(false);
  const showToast = useCustomToast();
  const queryClient = useQueryClient();

  const fetchCommunities = useCallback(
    async (initial = false) => {
      if (loading) return;
      setLoading(true);
      try {
        if (!initial && (!lastVisible || !isPagination)) {
          setLoading(false);
          return;
        }
        const cursor: CommunityCursor = initial ? null : lastVisible;
        const { communities: fetched, newLastVisible } =
          await queryClient.fetchQuery({
            queryKey: keys.community.list({ limit: limitValue, cursor, sort }),
            queryFn: () => getCommunitiesAction(limitValue, cursor, sort),
          });

        if (fetched.length < limitValue) setNoMoreCommunities(true);
        if (newLastVisible) setLastVisible(newLastVisible);

        setCommunities((prev) =>
          initial ? (fetched as Community[]) : [...prev, ...(fetched as Community[])],
        );
      } catch (error) {
        console.log("Error: fetchCommunities", error);
        showToast({
          title: "Could not Find Communities",
          description: "There was an error getting communities",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, lastVisible, isPagination, limitValue, queryClient, showToast, sort],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- on-mount feed bootstrap via cached fetchQuery
    fetchCommunities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    communities,
    loading,
    fetchCommunities,
    noMoreCommunities,
  };
};

export default useCommunitiesFeed;