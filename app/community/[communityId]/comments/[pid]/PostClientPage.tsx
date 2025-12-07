"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { auth } from "@/firebase/clientApp";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostState from "@/hooks/posts/usePostState";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import { Stack } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Community } from "@/types/community";
import { Post } from "@/types/post";

type PostPageProps = {
  communityData: Community;
  postData: Post | null;
};

/**
 * Displays a single post.
 * Contains:
 *  - PostItem component
 *  - About component
 *  - Comments component
 *
 * @returns {React.FC} - Single post page with all components
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
  const { isAdmin } = useCommunityPermissions(currentCommunity);
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

  return (
    <PageContent>
      {/* Left */}
      <>
        {!postData && !postStateValue.selectedPost ? (
          <PostLoader />
        ) : (
          <>
            <Stack gap={3} direction="column">
              {postStateValue.selectedPost && (
                <PostItem
                  post={postStateValue.selectedPost}
                  onVote={onVote}
                  onDeletePost={onDeletePost}
                  userVoteValue={
                    postStateValue.postVotes.find(
                      (item) => item.postId === postStateValue.selectedPost?.id
                    )?.voteValue
                  }
                  userIsCreator={
                    user?.uid === postStateValue.selectedPost?.creatorId
                  }
                  userIsAdmin={isAdmin}
                  showCommunityImage={true}
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
        )}
      </>
      {currentCommunity && <About communityData={currentCommunity} />}
      {/* Right */}
      <></>
    </PageContent>
  );
};
export default PostPage;
