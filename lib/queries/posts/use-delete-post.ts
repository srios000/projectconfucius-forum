"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deletePostAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { Post } from "@/types/post";
import { removeFromInfiniteFeed } from "@/lib/queries/posts/optimistic-helpers";
import type { FeedPage } from "@/lib/queries/posts/use-posts-infinite";

export type DeletePostArgs = { postId: string };

type Ctx = {
    prevDetail: Post | undefined;
    prevFeeds: [readonly unknown[], InfiniteData<FeedPage> | undefined][];
};

const feedPredicate = (q: { queryKey: readonly unknown[] }) =>
    q.queryKey[0] === "posts" && q.queryKey[1] === "feed";

export function useDeletePostMutation() {
    const qc = useQueryClient();
    return useMutation<unknown, Error, DeletePostArgs, Ctx>({
        mutationKey: ["posts", "delete"],
        mutationFn: ({ postId }) => deletePostAction(postId),
        onMutate: async ({ postId }) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: keys.posts.detail(postId) }),
                qc.cancelQueries({ predicate: feedPredicate }),
            ]);

            const prevDetail = qc.getQueryData<Post>(keys.posts.detail(postId));
            const prevFeeds = qc.getQueriesData<InfiniteData<FeedPage>>({ predicate: feedPredicate });

            qc.setQueryData(keys.posts.detail(postId), undefined);

            prevFeeds.forEach(([key, data]) => {
                if (data && 'pages' in data && Array.isArray(data.pages)) {
                    const updated = removeFromInfiniteFeed<FeedPage>(data, postId);
                    if (updated) {
                        qc.setQueryData<InfiniteData<FeedPage>>(key, updated);
                    }
                }
            });

            return { prevDetail, prevFeeds };
        },
        onError: (_err, { postId }, ctx) => {
            if (!ctx) return;
            qc.setQueryData(keys.posts.detail(postId), ctx.prevDetail);
            ctx.prevFeeds.forEach(([key, data]) => qc.setQueryData(key, data));
        },
        onSettled: (_data, _err, { postId }) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(postId) });
            void qc.invalidateQueries({ predicate: feedPredicate });
        },
    });
}