import { firestore } from "@/firebase/clientApp";
import useCustomToast from "@/hooks/useCustomToast";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Community } from "@/atoms/communitiesAtom";

type UseCommunitiesFeedProps = {
  limitValue?: number;
  isPagination?: boolean;
};

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
      let communityQuery;
      if (initial) {
        communityQuery = query(
          collection(firestore, "communities"),
          orderBy("numberOfMembers", "desc"),
          limit(limitValue)
        );
      } else {
        if (!lastVisible || !isPagination) return;
        communityQuery = query(
          collection(firestore, "communities"),
          orderBy("numberOfMembers", "desc"),
          startAfter(lastVisible),
          limit(limitValue)
        );
      }

      const communityDocs = await getDocs(communityQuery);
      const fetchedCommunities = communityDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (communityDocs.docs.length < limitValue) setNoMoreCommunities(true);
      if (communityDocs.docs.length > 0)
        setLastVisible(communityDocs.docs[communityDocs.docs.length - 1]);

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
