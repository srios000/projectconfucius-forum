"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePostAction, unsavePostAction } from "@/app/actions/posts";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";
import type { Post } from "@/types/post";

export function useSavePostMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: (post: Post) => savePostAction(post),
        onSuccess: () => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.posts.saved(userId) });
            }
        },
    });
}

export type UnsavePostArgs = { postId: string };

export function useUnsavePostMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ postId }: UnsavePostArgs) => unsavePostAction(postId),
        onSuccess: () => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.posts.saved(userId) });
            }
        },
    });
}