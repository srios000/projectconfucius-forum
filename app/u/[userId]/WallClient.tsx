"use client";

import { useMemo } from "react";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import PostItem from "@/components/posts/post-item/PostItem";
import InlineComposer from "@/components/posts/composer/InlineComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";
import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { useUserProfileQuery } from "@/lib/queries/users/use-user-profile";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostDeletion from "@/hooks/posts/usePostDeletion";

export default function WallClient({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { data: profile, isLoading: loadingProfile } = useUserProfileQuery({ idOrUsername: userId });
  const ownerId = profile?.id ?? userId;

  const feed = usePostsInfiniteQuery({
    scope: { wallUserId: ownerId },
    enabled: !!profile,
  });

  const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.posts) ?? [], [feed.data]);
  const postIds = useMemo(() => posts.map((p) => p.id!), [posts]);
  const votes = useUserPostVotesQuery({ postIds, enabled: !!user });
  const postVotes = votes.data ?? [];

  const { onSelectPost } = usePostSelection();
  const { onVote, isVotePending } = usePostVote();
  const { onDeletePost } = usePostDeletion();

  const loading = feed.isLoading || feed.isFetching;
  const initials = (profile?.name ?? userId).split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  if (loadingProfile) {
    return <PageContent><PostLoader /></PageContent>;
  }
  if (!profile) {
    return (
      <PageContent>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="font-serif text-xl mb-1">User not found</h2>
          <p className="text-sm text-muted-foreground">No user matches <code>u/{userId}</code>.</p>
        </div>
      </PageContent>
    );
  }

  return (
    <>
      <header className="bg-card border-b border-border">
        <div className="mx-auto max-w-6xl px-3 py-4 flex items-center gap-3">
          <Avatar className="size-12">
            {profile.imageUrl && <AvatarImage src={profile.imageUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-serif font-semibold text-[20px] leading-tight tracking-[-0.01em] truncate">
              {profile.name}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              u/{profile.username ?? profile.id}&apos;s wall
            </p>
          </div>
        </div>
      </header>
      <PageContent>
        <>
          {user ? (
            <InlineComposer wallUserId={ownerId} />
          ) : (
            <div className="bg-muted/40 border border-border rounded-xl px-3.5 py-3 text-[12.5px] text-muted-foreground">
              <a href="/api/auth/start" className="text-primary font-semibold">Sign in</a> to post on this wall.
            </div>
          )}
          {loading && posts.length === 0 ? (
            <PostLoader />
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onSelectPost={onSelectPost}
                  onDeletePost={onDeletePost}
                  onVote={onVote}
                  isVotePending={isVotePending(post.id!)}
                  userVoteValue={postVotes.find((v) => v.postId === post.id)?.voteValue}
                  userIsCreator={user?.id === post.creatorId}
                />
              ))}
              {posts.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No posts on this wall yet.
                </div>
              )}
              {feed.hasNextPage && posts.length > 0 && (
                <Button
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  variant="outline"
                  className="w-full my-4"
                >
                  {feed.isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              )}
            </div>
          )}
        </>
      </PageContent>
    </>
  );
}
