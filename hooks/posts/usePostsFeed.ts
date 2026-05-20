"use client";

import { useCallback, useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { postStateAtom } from "@/atoms/postsAtom";
import { Post } from "@/types/post";
import { getPostsAction } from "@/app/actions/reads";
import type { PostCursor } from "@/lib/posts/getPosts";
import { keys } from "@/lib/queries/keys";
import useCustomToast from "../useCustomToast";

type UsePostsFeedProps = {
  communityId?: string;
  communityIds?: string[];
  isGenericHome?: boolean;
};

/**
 * A custom hook that manages the post feed for communities and the home page.
 * It handles paginated fetching of posts.
 * @param communityId - Optional identifier to fetch posts for a specific community.
 * @param communityIds - Optional array of identifiers to fetch posts for a personalized home feed.
 * @param isGenericHome - Optional flag to fetch posts for the generic home feed.
 * @returns An object containing the loading state, fetchPosts function, and a flag for no more posts.
 */
const usePostsFeed = ({
  communityId,
  communityIds,
  isGenericHome,
}: UsePostsFeedProps) => {
  const setPostStateValue = useSetAtom(postStateAtom);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<PostCursor>(null);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [accumulated, setAccumulated] = useState<Post[]>([]);
  const showToast = useCustomToast();

  const scope = { communityId, communityIds, isGenericHome };

  const fetchPosts = useCallback(
    async (initial = false) => {
      if (loading) return;
      if (!initial && noMorePosts) return;
      if (!initial && !lastVisible) return;

      setLoading(true);
      try {
        const cursor: PostCursor = initial ? null : lastVisible;
        const result = await queryClient.fetchQuery({
          queryKey: keys.posts.feed({ scope, cursor }),
          queryFn: () =>
            getPostsAction(
              scope.communityId,
              scope.communityIds,
              scope.isGenericHome,
              cursor,
            ),
        });
        const { posts, newLastVisible } = result;

        if (posts.length < 10) setNoMorePosts(true);
        if (newLastVisible) setLastVisible(newLastVisible);
        else if (initial) setNoMorePosts(true);

        const next = initial
          ? (posts as Post[])
          : [...accumulated, ...(posts as Post[])];
        setAccumulated(next);
        setPostStateValue((prev) => ({ ...prev, posts: next }));
      } catch (error) {
        console.log("Error: fetchPosts", error);
        showToast({
          title: "Could not Fetch Posts",
          description: "There was an error fetching posts",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      noMorePosts,
      lastVisible,
      queryClient,
      accumulated,
      scope.communityId,
      scope.communityIds,
      scope.isGenericHome,
      setPostStateValue,
      showToast,
    ],
  );

  useEffect(() => {
    setNoMorePosts(false);
    setLastVisible(null);
    setAccumulated([]);
    setPostStateValue((prev) => ({ ...prev, posts: [] }));

    return () => {
      setPostStateValue((prev) => ({ ...prev, posts: [] }));
    };
  }, [communityId, isGenericHome, setPostStateValue]);

  return {
    loading,
    fetchPosts,
    noMorePosts,
  };
};

export default usePostsFeed;