"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import CreatePostLink from "@/components/Community/CreatePostLink";
import PersonalHome from "@/components/Community/PersonalHome";
import Recommendations from "@/components/Community/recommendations/Recommendations";
import PageContent from "@/components/Layout/PageContent";
import PostLoader from "@/components/Loaders/post-loader/PostLoader";
import PostItem from "@/components/Posts/post-item/PostItem";
import { auth, firestore } from "@/firebase/clientApp";
import useCommunityState from "@/hooks/community/useCommunityState";
import useCustomToast from "@/hooks/useCustomToast";
import usePostState from "@/hooks/posts/usePostState";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import usePostsFeed from "@/hooks/posts/usePostsFeed";
import { Box, Spinner, Stack, Text } from "@chakra-ui/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const [user, loadingUser] = useAuthState(auth);
  const { communityStateValue } = useCommunityState();
  const { postStateValue, setPostStateValue } = usePostState();
  const { onSelectPost } = usePostSelection(setPostStateValue);
  const { onVote, getPostVotes } = usePostVote(
    postStateValue,
    setPostStateValue
  );
  const { onDeletePost } = usePostDeletion(setPostStateValue);
  usePostVoteSync(setPostStateValue);
  const showToast = useCustomToast();

  const communityIds = useMemo(
    () => communityStateValue.mySnippets.map((snippet) => snippet.communityId),
    [communityStateValue.mySnippets]
  );

  const { loading, fetchPosts, ref, noMorePosts } = usePostsFeed({
    communityIds: user && communityIds.length > 0 ? communityIds : undefined,
    isGenericHome: !user || communityIds.length === 0,
  });

  /**
   * Loads the home feed for authenticated users.
   * Runs when the community snippets have been fetched when the user
   */
  useEffect(() => {
    if (communityStateValue.snippetFetched) {
      fetchPosts(true);
    }
  }, [communityStateValue.snippetFetched, user, communityIds.length]);

  /**
   * Loads the home feed for unauthenticated users.
   * Runs when there is no user and the system is no longer attempting to fetch a user.
   * While the system is attempting to fetch user, the user is null.
   */
  useEffect(() => {
    if (!user && !loadingUser) {
      fetchPosts(true);
    }
  }, [user, loadingUser]);

  /**
   * Posts need to exist before trying to fetch votes for posts
   */
  useEffect(() => {
    if (user && postStateValue.posts.length) {
      const postIds = postStateValue.posts.map((post) => post.id!);
      getPostVotes(postIds);

      return () => {
        setPostStateValue((prev) => ({
          ...prev,
          postVotes: [],
        }));
      };
    }
  }, [user, postStateValue.posts]);

  return (
    <PageContent>
      <>
        <CreatePostLink />
        {loading && postStateValue.posts.length === 0 ? (
          <PostLoader />
        ) : (
          <Stack gap={3}>
            {postStateValue.posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onSelectPost={onSelectPost}
                onDeletePost={onDeletePost}
                onVote={onVote}
                userVoteValue={
                  postStateValue.postVotes.find(
                    (item) => item.postId === post.id
                  )?.voteValue
                }
                userIsCreator={user?.uid === post.creatorId}
                userIsAdmin={
                  !!communityStateValue.mySnippets.find(
                    (snippet) => snippet.communityId === post.communityId
                  )?.isAdmin
                }
                showCommunityImage={true}
              />
            ))}
            {!noMorePosts ? (
              <Box
                ref={ref}
                height="20px"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                {loading && <Spinner size="sm" />}
              </Box>
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
