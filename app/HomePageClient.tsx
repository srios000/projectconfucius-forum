"use client";

import CreatePostLink from "@/components/community/CreatePostLink";
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
import usePostsFeed from "@/hooks/posts/usePostsFeed";
import { Button, Stack, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import type { PostVote } from "@/types/post";

export default function HomePageClient() {
    const { data: session, isPending: loadingUser } = useSession();
    const user = session?.user ?? null;
    const { communityStateValue } = useCommunityState();
    const { onSelectPost } = usePostSelection();

    const communityIds = useMemo(
        () => communityStateValue.mySnippets.map((snippet) => snippet.communityId),
        [communityStateValue.mySnippets],
    );

    const { posts, setPosts, loading, fetchPosts, noMorePosts } = usePostsFeed({
        communityIds: user && communityIds.length > 0 ? communityIds : undefined,
        isGenericHome: !user || communityIds.length === 0,
    });

    const [postVotes, setPostVotes] = useState<PostVote[]>([]);
    const { onVote, getPostVotes } = usePostVote({
        posts,
        setPosts,
        postVotes,
        setPostVotes,
    });
    const { onDeletePost } = usePostDeletion({ posts, setPosts });

    useEffect(() => {
        if (communityStateValue.snippetFetched) {
            fetchPosts(true);
        }
    }, [communityStateValue.snippetFetched, user, communityIds.length]);

    useEffect(() => {
        if (!user && !loadingUser) {
            fetchPosts(true);
        }
    }, [user, loadingUser]);

    useEffect(() => {
        if (user && posts.length) {
            const postIds = posts.map((post) => post.id!);
            getPostVotes(postIds);
            return () => {
                setPostVotes([]);
            };
        }
    }, [user, posts]);

    return (
        <PageContent>
            <>
                <CreatePostLink />
                {loading && posts.length === 0 ? (
                    <PostLoader />
                ) : (
                    <Stack gap={3}>
                        {posts.map((post) => (
                            <PostItem
                                key={post.id}
                                post={post}
                                onSelectPost={onSelectPost}
                                onDeletePost={onDeletePost}
                                onVote={onVote}
                                userVoteValue={
                                    postVotes.find((item) => item.postId === post.id)
                                        ?.voteValue
                                }
                                userIsCreator={false}
                                userIsAdmin={
                                    !!communityStateValue.mySnippets.find(
                                        (snippet) => snippet.communityId === post.communityId,
                                    )?.isModerator
                                }
                                showCommunityImage={true}
                            />
                        ))}
                        {!noMorePosts ? (
                            <Button
                                onClick={() => fetchPosts(false)}
                                loading={loading}
                                variant="outline"
                                width="100%"
                                my={4}
                            >
                                Load More
                            </Button>
                        ) : (
                            <Text textAlign="center" p={2} fontSize="sm" color="gray.500">
                                No more posts
                            </Text>
                        )}
                    </Stack>
                )}
            </>
            <Stack gap={2}>
                <Recommendations />
                <PersonalHome />
            </Stack>
        </PageContent>
    );
}
