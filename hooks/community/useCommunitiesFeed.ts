import useCustomToast from "@/hooks/useCustomToast";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Community } from "@/types/community";
import { getCommunities as getCommunitiesLib } from "@/lib/community/getCommunities";

type UseCommunitiesFeedProps = {
  limitValue?: number;
  isPagination?: boolean;
};

/**
 * A custom hook that manages the community discovery feed.
 * It handles fetching communities ordered by member count and supports infinite scrolling via pagination.
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
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
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
        await getCommunitiesLib(limitValue, initial ? null : lastVisible);

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
