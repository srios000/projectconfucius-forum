import { Post } from "@/types/post";
import Link from "next/link";
import moment from "moment";
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";

type Props = { post: Post; showCommunityImage?: boolean };

export default function PostDetails({ post, showCommunityImage }: Props) {
  return (
    <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 mb-1">
      {showCommunityImage && (
        <Link href={`/c/${post.communityId}`} className="inline-flex items-center gap-1.5">
          <span
            className="size-3.5 rounded-full inline-block"
            style={{ background: "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))" }}
          />
          <span className="text-primary font-semibold">c/{post.communityId}</span>
        </Link>
      )}
      <span>· {moment(post.createdAt).fromNow()} ·</span>
      <span className="font-serif italic">{formatUserHandle(post.creatorUsername)}</span>
    </div>
  );
}
