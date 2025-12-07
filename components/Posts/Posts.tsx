/* eslint-disable react-hooks/exhaustive-deps */
import { Community } from "@/atoms/communitiesAtom";
import { auth } from "@/firebase/clientApp";
import useCommunityPermissions from "@/hooks/useCommunityPermissions";
import usePosts from "@/hooks/usePosts";
import usePostsFeed from "@/hooks/usePostsFeed";
import { Box, Spinner, Stack, Text } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import PostLoader from "../Loaders/post-loader/PostLoader";
import PostItem from "./post-item/PostItem";

/**
 * @param {Community} communityData - Community object from firebase
 */
type PostsProps = {
  communityData: Community;
};

/**
 * Displays all the posts in a community.
 * Displays a list of `PostItem` components.
 * While the posts are being fetched, displays a loading skeleton.
 * @param {Community} communityData - Community object from firebase
 *
 * @returns {React.FC<PostsProps>} - Posts component
 */
const Posts: React.FC<PostsProps> = ({ communityData }) => {
  const [user] = useAuthState(auth);
  const { postStateValue, onVote, onDeletePost, onSelectPost } = usePosts();
  const { isAdmin } = useCommunityPermissions(communityData);

  const { loading, fetchPosts, ref, noMorePosts } = usePostsFeed({
    communityId: communityData.id,
  });

  /**
   * Gets all votes in the community when component mounts (page loads).
   */
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
              userIsCreator={user?.uid === item.creatorId}
              userIsAdmin={isAdmin}
              userVoteValue={
                postStateValue.postVotes.find((vote) => vote.postId === item.id)
                  ?.voteValue
              }
              onVote={onVote}
              onSelectPost={onSelectPost}
              onDeletePost={onDeletePost}
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
  );
};
export default Posts;
