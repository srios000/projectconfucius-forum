"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function usePostQuery({
    postId,
    enabled = true,
}: {
    postId: string;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: keys.posts.detail(postId),
        queryFn: () => getPostAction(postId),
        enabled: enabled && !!postId,
    });
}