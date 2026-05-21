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

export default function PostDetailHeader({ post }: { post: Post }) {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { onVote, isVotePending } = usePostVote();
  const { data: community } = useCommunityDataQuery({ communityId: post.communityId });
  const permissions = useCommunityPermissions(community ?? undefined);
  const votingDisabled = !permissions.canPost;

  const votes = useUserPostVotesQuery({ postIds: [post.id!], enabled: !!user });
  const userVoteValue = votes.data?.find((v) => v.postId === post.id)?.voteValue;

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
        <div className="text-[10.5px] text-muted-foreground mb-1">
          <span className="text-primary font-semibold">c/{post.communityId}</span>
          {" · "}{moment(post.createdAt).fromNow()}{" · "}
          <span className="font-serif italic">u/{post.creatorUsername}</span>
        </div>
        <h1
          className="font-serif font-semibold text-[22px] leading-tight tracking-[-0.01em] mb-2"
          style={{ viewTransitionName: `title-${post.id}` }}
        >
          {post.title}
        </h1>
        {post.body && (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{post.body}</p>
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
    </article>
  );
}
