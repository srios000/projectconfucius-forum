"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostVotesAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { PostVote } from "@/types/post";

export function useUserPostVotesQuery({
    postIds,
    enabled = true,
}: {
    postIds: string[];
    enabled?: boolean;
}) {
    return useQuery<PostVote[]>({
        queryKey: keys.posts.userVotes(postIds),
        queryFn: () => getPostVotesAction(postIds) as Promise<PostVote[]>,
        enabled: enabled && postIds.length > 0,
    });
}
