"use client";
import { Post } from "@/types/post";
import moment from "moment";
import Image from "next/image";
import VoteSection from "../post-item/VoteSection";
import usePostVote from "@/hooks/posts/usePostVote";
import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { useSession } from "@/lib/auth-client";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import RichTextView from "@/components/editor/RichTextView";
import RichTextEditor from "@/components/editor/RichTextEditor";
import useCurrentRole from "@/hooks/useCurrentRole";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import { useEditPostMutation } from "@/lib/queries/posts/use-edit-post-mutation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PostDetailHeader({ post }: { post: Post }) {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { onVote, isVotePending } = usePostVote();
  const { data: community } = useCommunityDataQuery({ communityId: post.communityId ?? undefined });
  const permissions = useCommunityPermissions(community ?? undefined);
  const votingDisabled = post.communityId ? !permissions.canPost : !user;

  const votes = useUserPostVotesQuery({ postIds: [post.id!], enabled: !!user });
  const userVoteValue = votes.data?.find((v) => v.postId === post.id)?.voteValue;

  const router = useRouter();
  const { userId, isSuperadmin, isModeratorOf } = useCurrentRole();
  const isAuthor = !!userId && userId === post.creatorId;
  const isMod = isModeratorOf(post.communityId);
  const canEdit = isAuthor || isMod || isSuperadmin;
  const canDelete = isAuthor || isMod || isSuperadmin;
  const editMutation = useEditPostMutation();
  const { onDeletePost } = usePostDeletion();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);
  const editedByMod = !!post.editedAt && post.editedByRole && post.editedByRole !== "author";

  return (
    <article
      className="bg-card border border-border rounded-xl p-4 flex gap-3.5"
      style={{ viewTransitionName: `post-${post.id}` }}
    >
      <div style={{ viewTransitionName: `vote-${post.id}` }} className="w-8 shrink-0">
        <VoteSection
          userVoteValue={userVoteValue}
          onVote={onVote}
          post={post}
          votingDisabled={votingDisabled}
          isVotePending={isVotePending(post.id!)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] text-muted-foreground mb-1">
            {post.communityId ? (
              <span className="text-primary font-semibold">c/{post.communityId}</span>
            ) : (
              <span className="text-primary font-semibold">u/{post.wallUserId}&apos;s wall</span>
            )}
            {" · "}{moment(post.createdAt).fromNow()}{" · "}
            <span className="font-serif italic">u/{post.creatorUsername}</span>
            {post.editedAt && (
              <span
                className={
                  "ml-1 text-[10px] " +
                  (editedByMod ? "italic text-primary/70" : "text-muted-foreground")
                }
                title={
                  editedByMod
                    ? `edited by ${post.editedByRole} ${moment(post.editedAt).fromNow()}`
                    : `edited ${moment(post.editedAt).fromNow()}`
                }
              >
                · {editedByMod ? "edited by mod" : "edited"}
              </span>
            )}
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Post actions"
                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/40 transition-colors border-0 bg-transparent cursor-pointer"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                {canEdit && (
                  <DropdownMenuItem onClick={() => { setEditTitle(post.title); setEditBody(post.body); setEditOpen(true); }}>
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
        <h1
          className="font-serif font-semibold text-[22px] leading-tight tracking-[-0.01em] mb-2"
          style={{ viewTransitionName: `title-${post.id}` }}
        >
          {post.title}
        </h1>
        {post.body && (
          <RichTextView body={post.body} className="text-[13px] leading-relaxed" />
        )}
        {post.imageUrl && (
          <div className="mt-3 relative">
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={720}
              height={480}
              className="rounded-lg w-full h-auto"
            />
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {isAuthor && (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
              />
            )}
            <RichTextEditor value={editBody} onChange={setEditBody} placeholder="Body…" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={editMutation.isPending}>
              Cancel
            </Button>
            <Button
              disabled={editMutation.isPending || (isAuthor && !editTitle.trim())}
              onClick={async () => {
                try {
                  await editMutation.mutateAsync({
                    postId: post.id!,
                    title: isAuthor ? editTitle.trim() : undefined,
                    body: editBody,
                  });
                  setEditOpen(false);
                } catch (e) { console.error(e); }
              }}
            >
              {editMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>This removes all comments too. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const ok = await onDeletePost(post);
                setDeleting(false);
                if (ok) {
                  setConfirmDelete(false);
                  router.push(post.communityId ? `/c/${post.communityId}` : "/");
                }
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
