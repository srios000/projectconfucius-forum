"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommentsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { Comment } from "@/types/comment";

export function useCommentsForPostQuery({
    postId,
    enabled = true,
}: {
    postId: string;
    enabled?: boolean;
}) {
    return useQuery<Comment[]>({
        queryKey: keys.comments.forPost(postId),
        queryFn: () => getCommentsAction(postId) as Promise<Comment[]>,
        enabled: enabled && !!postId,
    });
}