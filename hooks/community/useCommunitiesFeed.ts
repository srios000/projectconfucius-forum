import useCustomToast from "@/hooks/useCustomToast";
import { useEffect, useState } from "react";
import { Community } from "@/types/community";
import { getCommunitiesAction } from "@/app/actions/reads";
import type { CommunityCursor } from "@/lib/community/getCommunities";

type UseCommunitiesFeedProps = {
  limitValue?: number;
  isPagination?: boolean;
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
}: UseCommunitiesFeedProps) => {
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [lastVisible, setLastVisible] = useState<CommunityCursor>(null);
  const [noMoreCommunities, setNoMoreCommunities] = useState(false);
  const showToast = useCustomToast();

  const fetchCommunities = async (initial = false) => {
    if (loading) return;
    setLoading(true);
    try {
      if (!initial && (!lastVisible || !isPagination)) {
        setLoading(false);
        return;
      }

      const { communities: fetchedCommunities, newLastVisible } =
        await getCommunitiesAction(limitValue, initial ? null : lastVisible);

      if (fetchedCommunities.length < limitValue) setNoMoreCommunities(true);
      if (newLastVisible) setLastVisible(newLastVisible);

      setCommunities((prev) =>
        initial
          ? (fetchedCommunities as Community[])
          : [...prev, ...(fetchedCommunities as Community[])]
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
  };

  useEffect(() => {
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
