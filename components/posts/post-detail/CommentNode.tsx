"use client";
import { useState } from "react";
import moment from "moment";
import { Comment } from "@/types/comment";
import { CommentVote } from "@/lib/comments/getCommentVotes";
import { MAX_INLINE_DEPTH, countDescendants } from "@/lib/utils/comment-tree";
import ContinueThreadButton from "./ContinueThreadButton";
import RepliesSummary from "./RepliesSummary";
import InlineReplyComposer from "./InlineReplyComposer";
import CommentVoteSection from "./CommentVoteSection";
import useCommentVote from "@/hooks/comments/useCommentVote";
import RichTextView from "@/components/editor/RichTextView";

type Props = {
  comment: Comment & { children?: Comment[] };
  depth: number;
  communityId: string | null;
  postId: string;
  postAuthorId?: string;
  votes?: CommentVote[];
};

export default function CommentNode({
  comment, depth, communityId, postId, postAuthorId, votes,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const isOP = !!postAuthorId && comment.creatorId === postAuthorId;
  const hiddenCount = collapsed ? countDescendants(comment) : 0;
  const cutoff = depth >= MAX_INLINE_DEPTH;
  const { onVote, isVotePending } = useCommentVote();
  const userVoteValue = votes?.find(v => v.commentId === comment.id)?.voteValue;

  return (
    <div className="flex gap-2 py-1">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand thread" : "Collapse thread"}
        className="group/spine w-4 shrink-0 flex justify-center pt-7 cursor-pointer border-0 bg-transparent"
      >
        <span className="block w-[1px] flex-1 rounded bg-border group-hover/spine:bg-primary transition-colors" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] mb-0.5">
          <span className={isOP ? "font-bold text-primary" : "font-bold text-foreground"}>
            u/{comment.creatorDisplayText}
          </span>
          {isOP && (
            <span className="bg-primary text-primary-foreground text-[8.5px] font-extrabold px-1 py-px rounded uppercase tracking-wider">
              OP
            </span>
          )}
          <span className="text-muted-foreground text-[10.5px]">{moment(comment.createdAt).fromNow()}</span>
          {collapsed && <RepliesSummary count={hiddenCount} />}
        </div>
        {!collapsed && (
          <>
            <RichTextView
              body={comment.text}
              className="text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap mt-1 mb-2"
            />
            <div className="flex items-center gap-4 mt-1">
              <CommentVoteSection
                comment={comment}
                onVote={onVote}
                userVoteValue={userVoteValue}
                isVotePending={isVotePending(comment.id)}
              />
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="flex items-center gap-1.5 text-muted-foreground text-[10.5px] font-semibold px-2 py-1 rounded hover:bg-primary-mute hover:text-primary transition-colors cursor-pointer border-0 bg-transparent"
              >
                Reply
              </button>
            </div>
            {replyOpen && (
              <InlineReplyComposer
                postId={postId}
                parentId={comment.id ?? null}
                onDone={() => setReplyOpen(false)}
              />
            )}
            {(comment.children?.length ?? 0) > 0 && (
              <>
                {cutoff ? (
                  <ContinueThreadButton
                    communityId={communityId}
                    postId={postId}
                    commentId={comment.id!}
                    hiddenCount={countDescendants(comment)}
                  />
                ) : (
                  <div className="ml-4 border-l border-border pl-2 mt-1.5 space-y-1">
                    {comment.children!.map((child) => (
                      <CommentNode
                        key={child.id}
                        comment={child as Comment & { children?: Comment[] }}
                        depth={depth + 1}
                        communityId={communityId}
                        postId={postId}
                        postAuthorId={postAuthorId}
                        votes={votes}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
