"use client";

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
import { useMeQuery } from "@/lib/queries/profile/use-me";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import type { PostSort } from "@/lib/posts/getPosts";

const SORTS: { value: PostSort; label: string }[] = [
    { value: "top", label: "Top" },
    { value: "new", label: "New" },
    { value: "controversial", label: "Controversial" },
];

export default function HomePageClient() {
    const { data: session, isPending: loadingUser } = useSession();
    const user = session?.user ?? null;
    const { data: me } = useMeQuery();
    const { communityStateValue } = useCommunityState();
    const { onSelectPost } = usePostSelection();
    const [sort, setSort] = useState<PostSort>("top");

    const communityIds = useMemo(
        () => communityStateValue.mySnippets.map((s) => s.communityId),
        [communityStateValue.mySnippets],
    );
    const hasSubs = !!user && communityIds.length > 0;

    const feed = usePostsInfiniteQuery({
        scope: {
            communityIds: hasSubs ? communityIds : undefined,
            isGenericHome: !user || communityIds.length === 0,
            sort,
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
                <div className="flex items-center gap-1 mb-3 bg-card border border-border rounded-lg px-2 py-1.5">
                    {SORTS.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setSort(s.value)}
                            className={
                                "text-[11px] font-semibold px-2.5 py-1 rounded transition-colors " +
                                (sort === s.value
                                    ? "bg-primary-mute text-primary"
                                    : "text-muted-foreground hover:bg-muted")
                            }
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
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
                                userIsCreator={!!me?.id && me.id === post.creatorId}
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
        </PageContent>
    );
}