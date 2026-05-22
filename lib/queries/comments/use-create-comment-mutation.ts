"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentAction } from "@/app/actions/comments";
import { keys } from "@/lib/queries/keys";

export type CreateCommentArgs = {
    communityId: string | null;
    postId: string;
    postTitle: string;
    commentText: string;
    parentId?: string;
};

export function useCreateCommentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, postId, postTitle, commentText, parentId }: CreateCommentArgs) =>
            createCommentAction(communityId, postId, postTitle, commentText, parentId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.comments.forPost(vars.postId) });
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.postId) });
        },
    });
}