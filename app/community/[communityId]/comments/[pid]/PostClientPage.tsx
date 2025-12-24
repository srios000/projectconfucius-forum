"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { auth } from "@/firebase/clientApp";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostState from "@/hooks/posts/usePostState";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { Stack } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

type PostPageProps = {
  communityData: Community;
  postData: Post | null;
};

/**
 * The client-side page for viewing a single post and its associated comment thread.
 * Manages post-specific state including voting, deletion, and comment loading.
 * Enforces community-level viewing permissions.
 * @param communityData - The community context for the post.
 * @param postData - The post data fetched on the server.
 * @returns A page layout with the post item and its comments.
 */
const PostPage: React.FC<PostPageProps> = ({ communityData, postData }) => {
  const { postStateValue, setPostStateValue } = usePostState();
  const { onVote } = usePostVote(postStateValue, setPostStateValue);
  const { onDeletePost } = usePostDeletion(setPostStateValue);
  usePostVoteSync(setPostStateValue);

  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);
  const currentCommunity =
    communityStateValue.currentCommunity || communityData;
  const { isAdmin, canView, canPost, loading } =
    useCommunityPermissions(currentCommunity);
  const [user] = useAuthState(auth);

  useEffect(() => {
    setCommunityStateValue((prev) => ({
      ...prev,
      currentCommunity: communityData,
    }));
  }, [communityData, setCommunityStateValue]);

  useEffect(() => {
    if (postData) {
      setPostStateValue((prev) => ({
        ...prev,
        selectedPost: postData,
      }));
    }
  }, [postData, setPostStateValue]);

  if (loading) {
    return (
      <PageContent>
        <PostLoader />
        <></>
      </PageContent>
    );
  }

  if (!canView) {
    return (
      <PageContent>
        <RestrictedCommunityBanner />
        <></>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <>
        <Stack gap={4}>
          {postStateValue.selectedPost && (
            <PostItem
              post={postStateValue.selectedPost}
              onVote={onVote}
              onDeletePost={onDeletePost}
              userVoteValue={
                postStateValue.postVotes.find(
                  (item) => item.postId === postStateValue.selectedPost!.id
                )?.voteValue
              }
              userIsCreator={
                user?.uid === postStateValue.selectedPost.creatorId
              }
              userIsAdmin={isAdmin}
              votingDisabled={!canPost}
            />
          )}
          <Comments
            user={user as User}
            selectedPost={postStateValue.selectedPost}
            communityId={postStateValue.selectedPost?.communityId as string}
            isCommunityAdmin={isAdmin}
          />
        </Stack>
      </>
      <>
        <About communityData={communityData} />
      </>
    </PageContent>
  );
};

export default PostPage;
