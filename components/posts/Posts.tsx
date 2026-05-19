/* eslint-disable react-hooks/exhaustive-deps */
import { Community } from "@/types/community";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostState from "@/hooks/posts/usePostState";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import usePostsFeed from "@/hooks/posts/usePostsFeed";
import { Button, Stack, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
import PostLoader from "../loaders/post-loader/PostLoader";
import PostItem from "./post-item/PostItem";

type PostsProps = {
  communityData: Community;
};

/**
 * Manages and displays a feed of posts for a specific community.
 * Handles infinite scrolling, post selection, voting, and deletion by coordinating multiple hooks.
 * @param communityData - The community context for which to load and display posts.
 * @returns A scrollable list of post items or a loading state.
 */
const Posts: React.FC<PostsProps> = ({ communityData }) => {
  const { postStateValue, setPostStateValue } = usePostState();
  const { onSelectPost } = usePostSelection(setPostStateValue);
  const { onVote } = usePostVote(postStateValue, setPostStateValue);
  const { onDeletePost } = usePostDeletion(setPostStateValue);
  usePostVoteSync(setPostStateValue);
  const { isAdmin, canPost } = useCommunityPermissions(communityData);

  const { loading, fetchPosts, noMorePosts } = usePostsFeed({
    communityId: communityData.id,
  });

  useEffect(() => {
    fetchPosts(true);
  }, [communityData]);

  return (
    <>
      {/* If loading is true and it's the initial load (no posts yet), display the post loader component */}
      {loading && postStateValue.posts.length === 0 ? (
        <PostLoader />
      ) : (
        // If the posts are available, display the post item components
        <Stack gap={3}>
          {/* For each post (item) iterebly create a post car component */}
          {postStateValue.posts.map((item) => (
            <PostItem
              key={item.id}
              post={item}
              userIsCreator={false}
              userIsAdmin={isAdmin}
              userVoteValue={
                postStateValue.postVotes.find((vote) => vote.postId === item.id)
                  ?.voteValue
              }
              onVote={onVote}
              onSelectPost={onSelectPost}
              onDeletePost={onDeletePost}
              votingDisabled={!canPost}
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
  );
};
export default Posts;
