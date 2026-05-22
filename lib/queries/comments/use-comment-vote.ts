import { useMutation, useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { voteCommentAction } from "@/app/actions/comments";
import { CommentVote } from "@/lib/comments/getCommentVotes";
import { Comment } from "@/types/comment";

type CommentVoteArgs = {
    commentId: string;
    postId: string;
    vote: number;
    existingVoteValue?: number;
};

type CommentVoteResult = {
    voteChange: number;
};

type Ctx = {
    prevDetail?: Comment[];
    prevVotes?: CommentVote[];
};

export const useCommentVoteMutation = () => {
    const qc = useQueryClient();
    return useMutation<CommentVoteResult, Error, CommentVoteArgs, Ctx>({
        mutationKey: ["comments", "vote"],
        mutationFn: ({ commentId, vote }) => {
            return voteCommentAction(commentId, vote);
        },
        onMutate: async (vars) => {
            await Promise.all([
                qc.cancelQueries({ queryKey: keys.comments.forPost(vars.postId) }),
                qc.cancelQueries({ queryKey: keys.comments.votes(vars.postId) }),
            ]);

            const prevDetail = qc.getQueryData<Comment[]>(keys.comments.forPost(vars.postId)) ?? [];
            const prevVotes = qc.getQueryData<CommentVote[]>(keys.comments.votes(vars.postId)) ?? [];

            const existingValue = vars.existingVoteValue ?? prevVotes.find((v) => v.commentId === vars.commentId)?.voteValue;
            
            let delta = vars.vote;
            if (existingValue === vars.vote) {
                delta = -vars.vote;
            } else if (existingValue) {
                delta = 2 * vars.vote;
            }

            let nextVote: CommentVote | undefined;
            if (existingValue !== vars.vote) {
                nextVote = { commentId: vars.commentId, voteValue: vars.vote };
            }

            qc.setQueryData<Comment[]>(keys.comments.forPost(vars.postId), (old = []) => {
                return old.map(c => 
                    c.id === vars.commentId ? { ...c, voteStatus: (c.voteStatus || 0) + delta } : c
                );
            });

            qc.setQueryData<CommentVote[]>(keys.comments.votes(vars.postId), (old = []) => {
                let next = [...old];
                if (!nextVote) {
                    next = next.filter((v) => v.commentId !== vars.commentId);
                } else {
                    const idx = next.findIndex((v) => v.commentId === vars.commentId);
                    if (idx >= 0) next[idx] = nextVote;
                    else next.push(nextVote);
                }
                return next;
            });

            return { prevDetail, prevVotes };
        },
        onError: (_err, vars, ctx) => {
            if (ctx?.prevDetail) {
                qc.setQueryData(keys.comments.forPost(vars.postId), ctx.prevDetail);
            }
            if (ctx?.prevVotes) {
                qc.setQueryData(keys.comments.votes(vars.postId), ctx.prevVotes);
            }
        },
        onSettled: (_data, _err, vars) => {
            void qc.invalidateQueries({ queryKey: keys.comments.forPost(vars.postId) });
            void qc.invalidateQueries({ queryKey: keys.comments.votes(vars.postId) });
        },
    });
};
