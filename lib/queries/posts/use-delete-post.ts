"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePostAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";

export type DeletePostArgs = { postId: string };

export function useDeletePostMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ postId }: DeletePostArgs) => deletePostAction(postId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
            void qc.invalidateQueries({
                predicate: (q) =>
                    q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
            });
        },
    });
}