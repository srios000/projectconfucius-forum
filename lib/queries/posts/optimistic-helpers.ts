import type { Post, PostVote } from "@/types/post";

export type VoteDeltaArgs = {
    vote: number;
    postId: string;
    communityId: string | null;
    existing?: PostVote;
};

export type VoteDeltaResult = {
    delta: number;
    nextVote?: PostVote;
    deletedVoteId?: string;
};

export function computeVoteDelta({ vote, postId, communityId, existing }: VoteDeltaArgs): VoteDeltaResult {
    if (!existing) {
        return {
            delta: vote,
            nextVote: {
                id: `optimistic-${postId}-${Date.now()}`,
                postId,
                communityId,
                voteValue: vote,
            },
        };
    }
    if (existing.voteValue === vote) {
        return { delta: -vote, deletedVoteId: existing.id };
    }
    return { delta: 2 * vote, nextVote: { ...existing, voteValue: vote } };
}

import type { InfiniteData } from "@tanstack/react-query";

type FeedPageLike<P> = { posts: P[]; newLastVisible: unknown };

export function mapInfiniteFeedPost<TPage extends FeedPageLike<any>>(
    data: InfiniteData<TPage> | undefined,
    postId: string,
    mapper: (post: TPage["posts"][number]) => TPage["posts"][number],
): InfiniteData<TPage> | undefined {
    if (!data) return undefined;
    return {
        ...data,
        pages: data.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) => (post.id === postId ? mapper(post) : post)),
        })),
    };
}

export function removeFromInfiniteFeed<TPage extends FeedPageLike<any>>(
    data: InfiniteData<TPage> | undefined,
    postId: string,
): InfiniteData<TPage> | undefined {
    if (!data) return undefined;
    return {
        ...data,
        pages: data.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((post) => post.id !== postId),
        })),
    };
}
