"use client";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Skeleton } from "@/components/ui/skeleton";
import PostDetailHeader from "./PostDetailHeader";
import Comments from "./Comments";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  communityId?: string;
  wallUserId?: string;
  postId: string;
  layout: "page" | "overlay";
};

export default function PostDetail({ communityId, wallUserId, postId, layout }: Props) {
  const { data: post, isLoading } = usePostQuery({ postId });
  const backHref = wallUserId ? `/u/${wallUserId}` : `/c/${communityId}`;
  const breadcrumb = wallUserId
    ? `forum.projectconfucius.id/u/${wallUserId}/posts/${postId}`
    : `forum.projectconfucius.id/c/${communityId}/posts/${postId}`;

  return (
    <div className="bg-card">
      {layout === "page" && (
        <div className="sticky top-0 z-10 bg-card border-b border-border px-3.5 py-2.5 flex items-center gap-2.5">
          <Link
            href={backHref}
            className="size-7 rounded-full bg-muted hover:bg-primary-mute hover:text-primary flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="text-[10.5px] font-mono text-muted-foreground truncate">
            {breadcrumb}
          </span>
        </div>
      )}
      <div className="p-4 space-y-3">
        {isLoading || !post
          ? <Skeleton className="h-32 w-full skel-jade rounded-xl" />
          : <PostDetailHeader post={post} />}
      </div>
      <Comments postId={postId} communityId={communityId ?? null} />
    </div>
  );
}
