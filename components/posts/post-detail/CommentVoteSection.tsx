"use client";
import { useState } from "react";
import MotionArrow from "@/components/posts/post-item/MotionArrow";
import VoteBurst from "@/components/posts/post-item/VoteBurst";
import { Comment } from "@/types/comment";

type Props = {
  userVoteValue?: number;
  onVote: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    commentId: string,
    postId: string,
    vote: number,
    existingVoteValue?: number
  ) => void;
  comment: Comment;
  votingDisabled?: boolean;
  isVotePending?: boolean;
};

export default function CommentVoteSection({
  userVoteValue, onVote, comment, votingDisabled, isVotePending,
}: Props) {
  const blocked = votingDisabled || isVotePending;
  const [burst, setBurst] = useState<{ at: number; value: 1 | -1 } | null>(null);

  const handle = (e: React.MouseEvent<SVGElement>, value: 1 | -1) => {
    if (blocked) return;
    onVote(e, comment.id, comment.postId, value, userVoteValue);
    if (userVoteValue !== value) setBurst({ at: Date.now(), value });
  };

  return (
    <div className="flex items-center gap-1 group">
      <VoteBurst show={!!burst} value={burst?.value ?? 1} id={burst?.at} />
      <MotionArrow
        filled={userVoteValue === 1}
        direction="up"
        color={userVoteValue === 1 ? "hsl(var(--primary))" : undefined}
        onClick={(e) => handle(e, 1)}
        disabled={blocked}
      />
      <span
        className={
          "font-bold text-xs tabular-nums transition-colors " +
          (userVoteValue === 1 ? "text-primary"
            : userVoteValue === -1 ? "text-destructive"
            : "text-muted-foreground")
        }
      >
        {comment.voteStatus || 0}
      </span>
      <MotionArrow
        filled={userVoteValue === -1}
        direction="down"
        color={userVoteValue === -1 ? "hsl(var(--destructive))" : undefined}
        onClick={(e) => handle(e, -1)}
        disabled={blocked}
      />
    </div>
  );
}
