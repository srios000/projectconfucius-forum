"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { Post } from "@/atoms/postsAtom";
import About from "@/components/Community/about/About";
import PageContent from "@/components/Layout/PageContent";
import PostLoader from "@/components/Loaders/post-loader/PostLoader";
import Comments from "@/components/Posts/Comments/Comments";
import PostItem from "@/components/Posts/post-item/PostItem";
import { auth } from "@/firebase/clientApp";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePosts from "@/hooks/posts/usePosts";
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
 * Displays a single post.
 * Contains:
 *  - PostItem component
 *  - About component
 *  - Comments component
 *
 * @returns {React.FC} - Single post page with all components
 */
const PostPage: React.FC<PostPageProps> = ({ communityData, postData }) => {
  const { postStateValue, setPostStateValue, onDeletePost, onVote } =
    usePosts();
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
