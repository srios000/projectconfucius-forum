"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunityPostVotesAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { PostVote } from "@/types/post";

export function useCommunityPostVotesQuery({
    communityId,
    enabled = true,
}: {
    communityId: string | undefined;
    enabled?: boolean;
}) {
    return useQuery<PostVote[]>({
        queryKey: keys.posts.votes(communityId ?? ""),
        queryFn: () => getCommunityPostVotesAction(communityId!) as Promise<PostVote[]>,
        enabled: enabled && !!communityId,
    });
}