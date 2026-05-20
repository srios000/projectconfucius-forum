"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

const usePostsFeed = ({
  communityId,
  communityIds,
  isGenericHome,
}: UsePostsFeedProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<PostCursor>(null);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
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
        const { posts: fetched, newLastVisible } = result;

        if (fetched.length < 10) setNoMorePosts(true);
        if (newLastVisible) setLastVisible(newLastVisible);
        else if (initial) setNoMorePosts(true);

        setPosts((prev) =>
          initial
            ? (fetched as Post[])
            : [...prev, ...(fetched as Post[])],
        );
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
      scope.communityId,
      scope.communityIds,
      scope.isGenericHome,
      showToast,
    ],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging state when scope changes; UI-state reset, not a fetch
    setNoMorePosts(false);
    setLastVisible(null);
    setPosts([]);
  }, [communityId, isGenericHome]);

  return {
    posts,
    setPosts,
    loading,
    fetchPosts,
    noMorePosts,
  };
};

export default usePostsFeed;
