import { Post } from "@/types/post";
import Link from "next/link";
import moment from "moment";
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";

type Props = { post: Post; showCommunityImage?: boolean };

export default function PostDetails({ post, showCommunityImage }: Props) {
  return (
    <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 mb-1">
      {showCommunityImage && post.communityId && (
        <Link href={`/c/${post.communityId}`} className="inline-flex items-center gap-1.5">
          <span
            className="size-3.5 rounded-full inline-block"
            style={{ background: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))" }}
          />
          <span className="text-primary font-semibold">c/{post.communityId}</span>
        </Link>
      )}
      {showCommunityImage && post.wallUserId && (
        <Link href={`/u/${post.wallUserId}`} className="inline-flex items-center gap-1.5">
          <span
            className="size-3.5 rounded-full inline-block"
            style={{ background: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))" }}
          />
          <span className="text-primary font-semibold">u/{post.wallUserId}&apos;s wall</span>
        </Link>
      )}
      <span>{showCommunityImage ? "· " : ""}{moment(post.createdAt).fromNow()} ·</span>
      <span className="font-serif italic">{formatUserHandle(post.creatorUsername)}</span>
    </div>
  );
}
