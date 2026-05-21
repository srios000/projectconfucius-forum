/* eslint-disable react-hooks/exhaustive-deps */
import { Community } from "@/types/community";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
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

const Posts: React.FC<PostsProps> = ({ communityData }) => {
  const { onSelectPost } = usePostSelection();
  const { posts, setPosts, loading, fetchPosts, noMorePosts } = usePostsFeed({
    communityId: communityData.id,
  });
  const { postVotes, setPostVotes } = usePostVoteSync();
  const { onVote, isVotePending } = usePostVote({
    posts,
    setPosts,
    postVotes,
    setPostVotes,
  });
  const { onDeletePost } = usePostDeletion({ posts, setPosts });
  const { isAdmin, canPost } = useCommunityPermissions(communityData);

  useEffect(() => {
    fetchPosts(true);
  }, [communityData]);

  return (
    <>
      {loading && posts.length === 0 ? (
        <PostLoader />
      ) : (
        <Stack gap={3}>
          {posts.map((item) => (
            <PostItem
              key={item.id}
              post={item}
              userIsCreator={false}
              userIsAdmin={isAdmin}
              userVoteValue={
                postVotes.find((vote) => vote.postId === item.id)?.voteValue
              }
              onVote={onVote}
              onSelectPost={onSelectPost}
              onDeletePost={onDeletePost}
              votingDisabled={!canPost}
              isVotePending={isVotePending(item.id!)}
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
