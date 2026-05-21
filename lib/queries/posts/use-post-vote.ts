"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { voteAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { Post, PostVote } from "@/types/post";
import {
    computeVoteDelta,
    mapInfiniteFeedPost,
    type VoteDeltaResult,
} from "@/lib/queries/posts/optimistic-helpers";
import type { FeedPage } from "@/lib/queries/posts/use-posts-infinite";

export type PostVoteArgs = {
    post: Post;
    vote: number;
    communityId: string;
    existing?: PostVote;
};

type PostVoteResult = {
    voteChange: number;
    newVote: PostVote | undefined;
    voteIdToDelete: string | undefined;
};

type Ctx = {
    prevDetail: Post | undefined;
    prevVotes: PostVote[];
    prevFeeds: [readonly unknown[], InfiniteData<FeedPage> | undefined][];
};

const feedPredicate = (q: { queryKey: readonly unknown[] }) =>
    q.queryKey[0] === "posts" && q.queryKey[1] === "feed";

export function usePostVoteMutation() {
    const qc = useQueryClient();
    return useMutation<PostVoteResult, Error, PostVoteArgs, Ctx>({
        mutationKey: ["posts", "vote"],
        mutationFn: ({ post, vote, communityId, existing }) =>
            voteAction(post, vote, communityId, existing),
        onMutate: async (vars) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: keys.posts.detail(vars.post.id!) }),
                qc.cancelQueries({ queryKey: keys.posts.votes(vars.communityId) }),
                qc.cancelQueries({ predicate: feedPredicate }),
            ]);

            const prevDetail = qc.getQueryData<Post>(keys.posts.detail(vars.post.id!));
            const prevVotes = qc.getQueryData<PostVote[]>(keys.posts.votes(vars.communityId)) ?? [];
            const prevFeeds = qc.getQueriesData<InfiniteData<FeedPage>>({ predicate: feedPredicate });

            const existing = vars.existing ?? prevVotes.find((v) => v.postId === vars.post.id);
            const { delta, nextVote, deletedVoteId }: VoteDeltaResult = computeVoteDelta({
                vote: vars.vote,
                postId: vars.post.id!,
                communityId: vars.communityId,
                existing,
            });

            const basePost = prevDetail ?? vars.post;
            const optimisticPost: Post = { ...basePost, voteStatus: basePost.voteStatus + delta };
            qc.setQueryData<Post>(keys.posts.detail(vars.post.id!), optimisticPost);

            qc.setQueryData<PostVote[]>(keys.posts.votes(vars.communityId), (old = []) => {
                let next = [...old];
                if (deletedVoteId) {
                    next = next.filter((v) => v.id !== deletedVoteId);
                } else if (nextVote) {
                    const idx = next.findIndex((v) => v.postId === vars.post.id);
                    if (idx >= 0) next[idx] = nextVote;
                    else next.push(nextVote);
                }
                return next;
            });

            prevFeeds.forEach(([key, data]) => {
                if (data && 'pages' in data && Array.isArray(data.pages)) {
                    const updated = mapInfiniteFeedPost<FeedPage>(data, vars.post.id!, (p) => ({ ...p, voteStatus: p.voteStatus + delta }));
                    if (updated) {
                        qc.setQueryData<InfiniteData<FeedPage>>(key, updated);
                    }
                }
            });

            return { prevDetail, prevVotes, prevFeeds };
        },
        onError: (_err, vars, ctx) => {
            if (!ctx) return;
            qc.setQueryData(keys.posts.detail(vars.post.id!), ctx.prevDetail);
            qc.setQueryData(keys.posts.votes(vars.communityId), ctx.prevVotes);
            ctx.prevFeeds.forEach(([key, data]) => qc.setQueryData(key, data));
        },
        onSettled: (_data, _err, vars) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.post.id!) });
            void qc.invalidateQueries({ queryKey: keys.posts.votes(vars.communityId) });
            void qc.invalidateQueries({ predicate: feedPredicate });
        },
    });
}