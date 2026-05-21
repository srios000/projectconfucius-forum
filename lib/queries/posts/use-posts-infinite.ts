"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getPostsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { PostCursor } from "@/lib/posts/getPosts";
import type { Post } from "@/types/post";

export type PostsFeedScope = {
    communityId?: string;
    communityIds?: string[];
    isGenericHome?: boolean;
};

export type FeedPage = { posts: Post[]; newLastVisible: PostCursor };

export function usePostsInfiniteQuery({
    scope,
    enabled = true,
}: {
    scope: PostsFeedScope;
    enabled?: boolean;
}) {
    return useInfiniteQuery<FeedPage, Error, { pages: FeedPage[]; pageParams: PostCursor[] }, ReturnType<typeof keys.posts.infiniteFeed>, PostCursor>({
        queryKey: keys.posts.infiniteFeed(scope),
        initialPageParam: null,
        queryFn: ({ pageParam }) =>
            getPostsAction(scope.communityId, scope.communityIds, scope.isGenericHome, pageParam) as Promise<FeedPage>,
        getNextPageParam: (last) => (last.newLastVisible ?? undefined) as PostCursor | undefined,
        enabled,
        staleTime: 0,
    });
}
