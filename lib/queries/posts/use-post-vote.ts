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
    communityId: string | null;
    existingVoteValue?: number;
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
        mutationFn: async ({ post, vote, communityId }) => {
            console.log("[VOTE 4/5 mutationFn -> server]", { postId: post.id, vote, communityId });
            const result = await voteAction(post, vote, communityId);
            console.log("[VOTE 5/5 server result]", { postId: post.id, ...result });
            return result;
        },
        onMutate: async (vars) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: keys.posts.detail(vars.post.id!) }),
                qc.cancelQueries({ queryKey: keys.posts.votes(vars.communityId) }),
                qc.cancelQueries({ predicate: feedPredicate }),
            ]);

            const prevDetail = qc.getQueryData<Post>(keys.posts.detail(vars.post.id!));
            const prevVotes = qc.getQueryData<PostVote[]>(keys.posts.votes(vars.communityId)) ?? [];
            const prevFeeds = qc.getQueriesData<InfiniteData<FeedPage>>({ predicate: feedPredicate });

            // Use existingVoteValue passed from UI, or fallback to query cache
            const existingValue = vars.existingVoteValue ?? prevVotes.find((v) => v.postId === vars.post.id)?.voteValue;
            
            const existingMock = existingValue ? {
                id: `mock-${vars.post.id}`,
                postId: vars.post.id!,
                communityId: vars.communityId,
                voteValue: existingValue
            } as PostVote : undefined;

            const { delta, nextVote, deletedVoteId }: VoteDeltaResult = computeVoteDelta({
                vote: vars.vote,
                postId: vars.post.id!,
                communityId: vars.communityId,
                existing: existingMock,
            });

            const basePost = prevDetail ?? vars.post;
            const optimisticPost: Post = { ...basePost, voteStatus: basePost.voteStatus + delta };
            console.log("[VOTE 3/5 onMutate optimistic]", {
                postId: vars.post.id,
                incomingVote: vars.vote,
                existingVoteValueArg: vars.existingVoteValue,
                existingValueResolved: existingValue,
                existingFromPrevVotesCache: prevVotes.find((v) => v.postId === vars.post.id)?.voteValue,
                delta,
                basePostVoteStatus: basePost.voteStatus,
                optimisticVoteStatus: optimisticPost.voteStatus,
                deletedVoteId,
                nextVoteValue: nextVote?.voteValue,
            });
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

            // Optimistic update for userVotes cache used in the feed
            const userVotesKey = keys.posts.userVotes([vars.post.id!]);
            // This is a bit tricky since userVotes is keyed by array of postIds.
            // A simpler approach for the feed is to let the invalidation handle it,
            // but since we want optimistic updates, let's update it if we find the exact key.
            qc.setQueryData<PostVote[]>(userVotesKey, (old = []) => {
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
            void qc.invalidateQueries({ queryKey: ["posts", "user-votes"] }); // Invalidate all userVotes arrays
            void qc.invalidateQueries({ predicate: feedPredicate });
        },
    });
}