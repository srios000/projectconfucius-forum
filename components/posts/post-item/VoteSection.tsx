"use client";
import { useState } from "react";
import MotionArrow from "./MotionArrow";
import VoteBurst from "./VoteBurst";
import { Post } from "@/types/post";

type Props = {
  userVoteValue?: number;
  onVote: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string,
  ) => void;
  post: Post;
  votingDisabled?: boolean;
  isVotePending?: boolean;
};

export default function VoteSection({
  userVoteValue, onVote, post, votingDisabled, isVotePending,
}: Props) {
  const blocked = votingDisabled || isVotePending;
  const [burst, setBurst] = useState<{ at: number; value: 1 | -1 } | null>(null);

  const handle = (e: React.MouseEvent<SVGElement>, value: 1 | -1) => {
    if (blocked) return;
    onVote(e, post, value, post.communityId);
    if (userVoteValue !== value) setBurst({ at: Date.now(), value });
  };

  return (
    <div className="relative flex flex-col items-center gap-1 w-8 py-1.5 rounded-md bg-muted group-hover:bg-primary-mute transition-colors">
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
            : "text-foreground")
        }
      >
        {post.voteStatus}
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
