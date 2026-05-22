"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostAction } from "@/app/actions/posts";

export type CreatePostArgs = {
    communityId?: string;
    communityImageUrl?: string;
    wallUserId?: string;
    postData?: { title: string; body: string };
    imageUrl?: string;
    title?: string;
    body?: string;
};

export function useCreatePostMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (vars: CreatePostArgs) => {
            const title = vars.title ?? vars.postData?.title ?? "";
            const body = vars.body ?? vars.postData?.body ?? "";
            const target = vars.wallUserId
                ? { kind: "wall" as const, wallUserId: vars.wallUserId }
                : { kind: "community" as const, communityId: vars.communityId!, communityImageUrl: vars.communityImageUrl };
            return createPostAction(target, { title, body }, vars.imageUrl);
        },
        onSuccess: (id: string) => {
            if (id) {
                sessionStorage.setItem("pcf:newPost", id);
            }
            void qc.invalidateQueries({
                predicate: (q) =>
                    q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
            });
        },
    });
}