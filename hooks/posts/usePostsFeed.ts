import { postStateAtom } from "@/atoms/postsAtom";
import { firestore } from "@/firebase/clientApp";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import useCustomToast from "../useCustomToast";
import { useIntersectionObserver } from "../useIntersectionObserver";
import { Post } from "@/types/post";

type UsePostsFeedProps = {
  communityId?: string;
  communityIds?: string[];
  isGenericHome?: boolean;
};

/**
 * Fetches paginated posts for a community or the generic home feed with infinite scroll support.
 * @param communityId - Single community id to scope the feed.
 * @param communityIds - List of community ids to aggregate into the feed.
 * @param isGenericHome - Whether to sort by vote status for the default home view.
 * @returns Loading flag, sentinel ref, no-more-posts flag, and a fetch function.
 */
const usePostsFeed = ({
  communityId,
  communityIds,
  isGenericHome,
}: UsePostsFeedProps) => {
  const setPostStateValue = useSetAtom(postStateAtom);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const showToast = useCustomToast();

  const observerOptions = useMemo(() => ({ threshold: 0.5 }), []);
  const { ref, isIntersecting } = useIntersectionObserver(observerOptions);

  const buildQuery = (initial: boolean) => {
    const constraints: QueryConstraint[] = [];

    if (communityId) {
      constraints.push(where("communityId", "==", communityId));
      constraints.push(orderBy("createTime", "desc"));
    } else if (communityIds && communityIds.length > 0) {
      constraints.push(where("communityId", "in", communityIds));
      constraints.push(orderBy("createTime", "desc"));
    } else if (isGenericHome) {
      constraints.push(orderBy("voteStatus", "desc"));
    }

    if (!initial && lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(10));

    return query(collection(firestore, "posts"), ...constraints);
  };

  const fetchPosts = async (initial = false) => {
    if (loading) return;
    if (!initial && noMorePosts) return;
    if (!initial && !lastVisible) return;

    setLoading(true);
    try {
      const postQuery = buildQuery(initial);
      const postDocs = await getDocs(postQuery);
      const posts = postDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (postDocs.docs.length < 10) setNoMorePosts(true);
      if (postDocs.docs.length > 0)
        setLastVisible(postDocs.docs[postDocs.docs.length - 1]);
      else if (initial) {
        setNoMorePosts(true);
      }

      setPostStateValue((prev) => ({
        ...prev,
        posts: initial
          ? (posts as Post[])
          : [...prev.posts, ...(posts as Post[])],
      }));
    } catch (error: any) {
      console.log("Error: fetchPosts", error);
      showToast({
        title: "Could not fetch posts",
        description: error.message || "There was an error fetching posts",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isIntersecting && !loading && !noMorePosts && lastVisible) {
      fetchPosts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIntersecting, loading, noMorePosts, lastVisible]);

  useEffect(() => {
    setNoMorePosts(false);
    setLastVisible(null);
    setPostStateValue((prev) => ({
      ...prev,
      posts: [],
    }));

    return () => {
      setPostStateValue((prev) => ({
        ...prev,
        posts: [],
      }));
    };
  }, [communityId, isGenericHome, setPostStateValue]);

  return {
    loading,
    fetchPosts,
    ref,
    noMorePosts,
  };
};

export default usePostsFeed;
