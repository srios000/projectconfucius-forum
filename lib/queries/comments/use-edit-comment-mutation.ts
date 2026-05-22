"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editCommentAction } from "@/app/actions/comments";
import { keys } from "@/lib/queries/keys";

export type EditCommentArgs = { commentId: string; postId: string; text: string };

export function useEditCommentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ commentId, text }: EditCommentArgs) => editCommentAction(commentId, text),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.comments.forPost(vars.postId) });
        },
    });
}
