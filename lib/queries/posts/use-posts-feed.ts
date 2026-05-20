"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { PostCursor } from "@/lib/posts/getPosts";

export type PostsFeedScope = {
    communityId?: string;
    communityIds?: string[];
    isGenericHome?: boolean;
};

export type UsePostsFeedQueryArgs = {
    scope: PostsFeedScope;
    cursor: PostCursor;
    enabled?: boolean;
};

export function usePostsFeedQuery({
    scope,
    cursor,
    enabled = true,
}: UsePostsFeedQueryArgs) {
    return useQuery({
        queryKey: keys.posts.feed({ scope, cursor }),
        queryFn: () =>
            getPostsAction(
                scope.communityId,
                scope.communityIds,
                scope.isGenericHome,
                cursor,
            ),
        enabled,
        staleTime: 0,
    });
}