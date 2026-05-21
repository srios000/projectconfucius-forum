"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCommentByIdQuery } from "@/lib/queries/comments/use-comment-by-id";
import CommentNode from "./CommentNode";

type Props = { communityId: string; postId: string; rootCommentId: string };

export default function SubThreadView({ communityId, postId, rootCommentId }: Props) {
  const { data: rootComment } = useCommentByIdQuery({ postId, commentId: rootCommentId });

  return (
    <div className="bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-3.5 py-2.5 flex items-center gap-2.5">
        <Link
          href={`/c/${communityId}/posts/${postId}`}
          className="size-7 rounded-full bg-muted hover:bg-primary-mute hover:text-primary flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-[10.5px] font-mono text-muted-foreground truncate">
          /c/{communityId}/posts/{postId}/comment/{rootCommentId}
        </span>
      </div>
      <div className="mx-4 my-3 px-3 py-2 bg-primary-mute border border-primary-soft rounded-lg text-[11px] text-primary-deep">
        <Link href={`/c/${communityId}/posts/${postId}`} className="text-primary font-semibold underline underline-offset-2">
          ← Full thread
        </Link>
        {" · "}Showing replies to <strong>u/{rootComment?.creatorDisplayText ?? "…"}</strong>
      </div>
      <div className="px-4 pb-4">
        {rootComment && (
          <div className="bg-card border border-border rounded-xl p-3">
            <CommentNode
              comment={rootComment}
              depth={0}
              communityId={communityId}
              postId={postId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
