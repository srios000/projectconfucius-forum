"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentAction } from "@/app/actions/comments";
import { keys } from "@/lib/queries/keys";

export type DeleteCommentArgs = { commentId: string; postId: string };

export function useDeleteCommentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ commentId, postId }: DeleteCommentArgs) =>
            deleteCommentAction(commentId, postId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.comments.forPost(vars.postId) });
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
        },
    });
}