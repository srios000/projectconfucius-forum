"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editPostAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";

export type EditPostArgs = { postId: string; title?: string; body?: string };

export function useEditPostMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ postId, title, body }: EditPostArgs) =>
            editPostAction(postId, { title, body }),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
            void qc.invalidateQueries({ queryKey: keys.posts.all });
        },
    });
}
