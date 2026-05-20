"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { voteAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import type { Post, PostVote } from "@/types/post";

export type PostVoteArgs = {
    post: Post;
    vote: number;
    communityId: string;
    existing?: PostVote;
};

export function usePostVoteMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ post, vote, communityId, existing }: PostVoteArgs) =>
            voteAction(post, vote, communityId, existing),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.posts.detail(vars.post.id!) });
            void qc.invalidateQueries({ queryKey: keys.posts.votes(vars.communityId) });
            void qc.invalidateQueries({
                predicate: (q) =>
                    q.queryKey[0] === "posts" && q.queryKey[1] === "feed",
            });
        },
    });
}