import { postStateAtom } from "@/atoms/postsAtom";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import useCustomToast from "../useCustomToast";
import { useIntersectionObserver } from "../useIntersectionObserver";
import { Post } from "@/types/post";
import { getPosts as getPostsLib } from "@/lib/posts/getPosts";

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

  const fetchPosts = async (initial = false) => {
    if (loading) return;
    if (!initial && noMorePosts) return;
    if (!initial && !lastVisible) return;

    setLoading(true);
    try {
      const { posts, newLastVisible } = await getPostsLib(
        communityId,
        communityIds,
        isGenericHome,
        initial ? null : lastVisible
      );

      if (posts.length < 10) setNoMorePosts(true);
      if (newLastVisible) setLastVisible(newLastVisible);
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
        title: "Could not Fetch Posts",
        description: "There was an error fetching posts",
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
