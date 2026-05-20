"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostAction } from "@/app/actions/posts";

export type CreatePostArgs = {
    communityId: string;
    communityImageUrl: string | undefined;
    postData: { title: string; body: string };
    imageUrl?: string;
};

export function useCreatePostMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, communityImageUrl, postData, imageUrl }: CreatePostArgs) =>
            createPostAction(communityId, communityImageUrl, postData, imageUrl),
        onSuccess: () => {
            void qc.invalidateQueries({
                predicate: (q) =>
                    q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
            });
        },
    });
}