"use client";
import { useState, useRef, useLayoutEffect } from "react";
import moment from "moment";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Comment } from "@/types/comment";
import { CommentVote } from "@/lib/comments/getCommentVotes";
import { MAX_INLINE_DEPTH, countDescendants } from "@/lib/utils/comment-tree";
import ContinueThreadButton from "./ContinueThreadButton";
import RepliesSummary from "./RepliesSummary";
import InlineReplyComposer from "./InlineReplyComposer";
import CommentVoteSection from "./CommentVoteSection";
import useCommentVote from "@/hooks/comments/useCommentVote";
import RichTextView from "@/components/editor/RichTextView";
import RichTextEditor from "@/components/editor/RichTextEditor";
import useCurrentRole from "@/hooks/useCurrentRole";
import useDeleteComment from "@/hooks/comments/useDeleteComment";
import { useEditCommentMutation } from "@/lib/queries/comments/use-edit-comment-mutation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  comment: Comment & { children?: Comment[] };
  depth: number;
  communityId: string | null;
  postId: string;
  postAuthorId?: string;
  votes?: CommentVote[];
};

const FOLD_AT_DEPTH = 1;

export default function CommentNode({
  comment, depth, communityId, postId, postAuthorId, votes,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [childrenExpanded, setChildrenExpanded] = useState(depth < FOLD_AT_DEPTH);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [bodyOverflows, setBodyOverflows] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const isOP = !!postAuthorId && comment.creatorId === postAuthorId;
  const hiddenCount = collapsed ? countDescendants(comment) : 0;
  const cutoff = depth >= MAX_INLINE_DEPTH;
  const { onVote, isVotePending } = useCommentVote();
  const userVoteValue = votes?.find(v => v.commentId === comment.id)?.voteValue;

  const { userId, isSuperadmin, isModeratorOf } = useCurrentRole();
  const isAuthor = !!userId && userId === comment.creatorId;
  const isMod = isModeratorOf(comment.communityId);
  const canEdit = isAuthor || isMod || isSuperadmin;
  const canDelete = isAuthor || isMod || isSuperadmin;
  const editMutation = useEditCommentMutation();
  const { deleteComment, deleteLoadingId } = useDeleteComment();
  const isDeleting = deleteLoadingId === comment.id;
  const editedByMod = !!comment.editedAt && comment.editedByRole && comment.editedByRole !== "author";

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setBodyOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [comment.text, bodyExpanded]);

  return (
    <div className="flex gap-1 py-1">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand thread" : "Collapse thread"}
        className="group/spine w-2 shrink-0 flex justify-center pt-7 cursor-pointer border-0 bg-transparent"
      >
        <span className="block w-px flex-1 rounded bg-border/60 group-hover/spine:bg-primary transition-colors" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 -mx-1">
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if ((comment.children?.length ?? 0) > 0 && !cutoff) {
                setChildrenExpanded((v) => !v);
              } else {
                setCollapsed((v) => !v);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if ((comment.children?.length ?? 0) > 0 && !cutoff) {
                  setChildrenExpanded((v) => !v);
                } else {
                  setCollapsed((v) => !v);
                }
              }
            }}
            className="flex-1 flex items-center gap-2 text-[11px] mb-0.5 cursor-pointer select-none px-1 py-0.5 rounded hover:bg-muted/40 transition-colors"
          >
            <span className={isOP ? "font-bold text-primary" : "font-bold text-foreground"}>
              u/{comment.creatorDisplayText}
            </span>
            {isOP && (
              <span className="bg-primary text-primary-foreground text-[8.5px] font-extrabold px-1 py-px rounded uppercase tracking-wider">
                OP
              </span>
            )}
            <span className="text-muted-foreground text-[10.5px]">{moment(comment.createdAt).fromNow()}</span>
            {comment.editedAt && (
              <span
                className={
                  "text-[10px] " +
                  (editedByMod ? "italic text-primary/70" : "text-muted-foreground")
                }
                title={
                  editedByMod
                    ? `edited by ${comment.editedByRole} ${moment(comment.editedAt).fromNow()}`
                    : `edited ${moment(comment.editedAt).fromNow()}`
                }
              >
                · {editedByMod ? "edited by mod" : "edited"}
              </span>
            )}
            {collapsed && <RepliesSummary count={hiddenCount} />}
            {!collapsed && !childrenExpanded && (comment.children?.length ?? 0) > 0 && !cutoff && (
              <span className="text-muted-foreground text-[10px]">· {countDescendants(comment)} hidden</span>
            )}
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Comment actions"
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/40 transition-colors border-0 bg-transparent cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {canEdit && (
                  <DropdownMenuItem onClick={() => { setEditText(comment.text); setEditOpen(true); }}>
                    <Pencil className="size-3.5 mr-1.5" /> Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3.5 mr-1.5" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {!collapsed && (
          <>
            {editOpen ? (
              <div className="my-1.5">
                <RichTextEditor
                  value={editText}
                  onChange={setEditText}
                  placeholder="Edit your comment…"
                  autoFocus
                  onSubmit={async () => {
                    if (!editText.trim() || editMutation.isPending) return;
                    try {
                      await editMutation.mutateAsync({ commentId: comment.id, postId, text: editText.trim() });
                      setEditOpen(false);
                    } catch (e) { console.error(e); }
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)} disabled={editMutation.isPending}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!editText.trim() || editMutation.isPending}
                    onClick={async () => {
                      try {
                        await editMutation.mutateAsync({ commentId: comment.id, postId, text: editText.trim() });
                        setEditOpen(false);
                      } catch (e) { console.error(e); }
                    }}
                  >
                    {editMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-expanded={bodyExpanded}
                onClick={(e) => {
                  // Clicks on links/interactive children inside the body shouldn't toggle.
                  const target = e.target as HTMLElement;
                  if (target.closest("a, button, [role='button']")) return;
                  if (bodyOverflows || bodyExpanded) setBodyExpanded((v) => !v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (bodyOverflows || bodyExpanded) setBodyExpanded((v) => !v);
                  }
                }}
                className={
                  "cursor-pointer rounded -mx-1 px-1 transition-colors " +
                  (bodyOverflows || bodyExpanded ? "hover:bg-muted/30" : "")
                }
              >
                <div ref={bodyRef} className={bodyExpanded ? "" : "line-clamp-6"}>
                  <RichTextView
                    body={comment.text}
                    className="text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap mt-1 mb-2"
                  />
                </div>
                {bodyOverflows && (
                  <div className="text-[10.5px] font-semibold text-primary mt-0.5 mb-1">
                    {bodyExpanded ? "Show less ▴" : "Show more ▾"}
                  </div>
                )}
              </div>
            )}
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
                ) : !childrenExpanded ? (
                  <button
                    type="button"
                    onClick={() => setChildrenExpanded(true)}
                    className="mt-1.5 text-[11px] font-semibold text-primary hover:underline cursor-pointer border-0 bg-transparent px-0"
                  >
                    Show {countDescendants(comment)} {countDescendants(comment) === 1 ? "reply" : "replies"} ▾
                  </button>
                ) : (
                  <div className="ml-1 pl-1 mt-1.5 space-y-1">
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
                    {depth >= FOLD_AT_DEPTH && (
                      <button
                        type="button"
                        onClick={() => setChildrenExpanded(false)}
                        className="text-[10.5px] text-muted-foreground hover:text-primary cursor-pointer border-0 bg-transparent px-0"
                      >
                        Hide replies ▴
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this comment?</DialogTitle>
            <DialogDescription>
              This will also remove every nested reply. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteComment(comment);
                setConfirmDelete(false);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
