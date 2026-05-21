import { Community } from "@/types/community";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostSelection from "@/hooks/posts/usePostSelection";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import { usePostsInfiniteQuery } from "@/lib/queries/posts/use-posts-infinite";
import { useUserPostVotesQuery } from "@/lib/queries/posts/use-user-post-votes";
import { useSession } from "@/lib/auth-client";
import { Button, Stack, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import PostLoader from "../loaders/post-loader/PostLoader";
import PostItem from "./post-item/PostItem";

type PostsProps = { communityData: Community };

const Posts: React.FC<PostsProps> = ({ communityData }) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { onSelectPost } = usePostSelection();

  const feed = usePostsInfiniteQuery({ scope: { communityId: communityData.id } });
  const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.posts) ?? [], [feed.data]);

  const postIds = useMemo(() => posts.map((p) => p.id!), [posts]);
  const votes = useUserPostVotesQuery({ postIds, enabled: !!user });
  const postVotes = votes.data ?? [];

  const { onVote, isVotePending } = usePostVote();
  const { onDeletePost } = usePostDeletion();
  const { isAdmin, canPost } = useCommunityPermissions(communityData);

  const loading = feed.isLoading || feed.isFetching;

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
              userVoteValue={postVotes.find((v) => v.postId === item.id)?.voteValue}
              onVote={onVote}
              onSelectPost={onSelectPost}
              onDeletePost={onDeletePost}
              votingDisabled={!canPost}
              isVotePending={isVotePending(item.id!)}
            />
          ))}
          {feed.hasNextPage ? (
            <Button onClick={() => feed.fetchNextPage()} loading={feed.isFetchingNextPage} variant="outline" width="100%" my={4}>
              Load More
            </Button>
          ) : (
            <Text textAlign="center" p={2} fontSize="sm" color="gray.500">No more posts</Text>
          )}
        </Stack>
      )}
    </>
  );
};
export default Posts;