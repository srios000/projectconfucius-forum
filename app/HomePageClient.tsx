"use client";

import PersonalHome from "@/components/community/PersonalHome";
import Recommendations from "@/components/community/recommendations/Recommendations";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityState from "@/hooks/community/useCommunityState";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";
import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function HomePageClient() {
    const { data: session, isPending: loadingUser } = useSession();
    const user = session?.user ?? null;
    const { communityStateValue } = useCommunityState();
    const { onSelectPost } = usePostSelection();

    const communityIds = useMemo(
        () => communityStateValue.mySnippets.map((s) => s.communityId),
        [communityStateValue.mySnippets],
    );
    const hasSubs = !!user && communityIds.length > 0;

    const feed = usePostsInfiniteQuery({
        scope: {
            communityIds: hasSubs ? communityIds : undefined,
            isGenericHome: !user || communityIds.length === 0,
        },
        enabled: user ? communityStateValue.snippetFetched : !loadingUser,
    });

    const posts = useMemo(
        () => feed.data?.pages.flatMap((p) => p.posts) ?? [],
        [feed.data],
    );

    const postIds = useMemo(() => posts.map((p) => p.id!), [posts]);
    const votes = useUserPostVotesQuery({ postIds, enabled: !!user });
    const postVotes = votes.data ?? [];

    const { onVote, isVotePending } = usePostVote();
    const { onDeletePost } = usePostDeletion();

    const loading = feed.isLoading || feed.isFetching;

    return (
        <PageContent>
            <>
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
                                userIsAdmin={
                                    !!communityStateValue.mySnippets.find((s) => s.communityId === post.communityId)?.isModerator
                                }
                                showCommunityImage={true}
                            />
                        ))}
                        {feed.hasNextPage ? (
                            <Button
                                onClick={() => feed.fetchNextPage()}
                                disabled={feed.isFetchingNextPage}
                                variant="outline"
                                className="w-full my-4"
                            >
                                {feed.isFetchingNextPage ? "Loading..." : "Load More"}
                            </Button>
                        ) : (
                            <div className="text-center p-2 text-sm text-muted-foreground">
                                No more posts
                            </div>
                        )}
                    </div>
                )}
            </>
            <div className="space-y-2">
                <Recommendations />
                <PersonalHome />
            </div>
        </PageContent>
    );
}