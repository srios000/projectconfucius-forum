import Link from "next/link";
import { buildCommentUrl } from "@/lib/utils/comment-url";

type Props = { communityId: string; postId: string; commentId: string; hiddenCount: number };

export default function ContinueThreadButton({ communityId, postId, commentId, hiddenCount }: Props) {
  return (
    <Link
      href={buildCommentUrl(communityId, postId, commentId)}
      className="mt-1.5 flex items-center justify-between rounded-lg px-3 py-2 border border-dashed border-primary-soft bg-linear-to-br from-primary-mute to-primary-mute/50 hover:border-primary group transition-all"
    >
      <div>
        <div className="text-[11.5px] font-semibold text-primary">Continue this thread</div>
        {hiddenCount > 0 && (
          <div className="text-[10px] text-muted-foreground">{hiddenCount} more replies</div>
        )}
      </div>
      <span className="text-primary text-sm group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );
}
