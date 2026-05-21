"use client";
import { useState } from "react";
import moment from "moment";
import { Comment } from "@/types/comment";
import { MAX_INLINE_DEPTH, countDescendants } from "@/lib/utils/comment-tree";
import ContinueThreadButton from "./ContinueThreadButton";
import RepliesSummary from "./RepliesSummary";
import InlineReplyComposer from "./InlineReplyComposer";

type Props = {
  comment: Comment & { children?: Comment[] };
  depth: number;
  communityId: string;
  postId: string;
  postAuthorId?: string;
};

export default function CommentNode({
  comment, depth, communityId, postId, postAuthorId,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const isOP = !!postAuthorId && comment.creatorId === postAuthorId;
  const hiddenCount = collapsed ? countDescendants(comment) : 0;
  const cutoff = depth >= MAX_INLINE_DEPTH;

  return (
    <div className="flex gap-2 py-1">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand thread" : "Collapse thread"}
        className="group/spine w-4 shrink-0 flex justify-center pt-7 cursor-pointer border-0 bg-transparent"
      >
        <span className="block w-0.5 flex-1 rounded bg-primary/20 group-hover/spine:bg-primary group-hover/spine:w-[3px] transition-all" />
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
            <p className="text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap">{comment.text}</p>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground text-[10.5px] font-semibold">
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="px-2 py-1 rounded hover:bg-primary-mute hover:text-primary transition-colors cursor-pointer border-0 bg-transparent font-semibold"
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
                  <div className="ml-4 border-l border-primary/20 pl-2 mt-1.5 space-y-1">
                    {comment.children!.map((child) => (
                      <CommentNode
                        key={child.id}
                        comment={child as Comment & { children?: Comment[] }}
                        depth={depth + 1}
                        communityId={communityId}
                        postId={postId}
                        postAuthorId={postAuthorId}
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
