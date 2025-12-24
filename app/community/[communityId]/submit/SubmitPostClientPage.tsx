"use client";

import { authModalStateAtom } from "@/atoms/authModalAtom";
import { communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import AuthButtons from "@/components/navbar/right-content/AuthButtons";
import NewPostForm from "@/components/posts/new-post-form/NewPostForm";
import { auth } from "@/firebase/clientApp";
import { Community } from "@/types/community";
import { Box, Stack, Text } from "@chakra-ui/react";
import { useAtom, useSetAtom } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import PostLoader from "@/components/loaders/post-loader/PostLoader";

type SubmitPostPageProps = {
  communityData: Community;
};

/**
 * The client-side page for submitting a new post to a community.
 * Enforces authentication and community-specific posting permissions.
 * Renders the post creation form and a sidebar with community information.
 * @param communityData - The community context for the new post.
 * @returns A page containing the post creation form or access restriction messages.
 */
const SubmitPostPage: React.FC<SubmitPostPageProps> = ({ communityData }) => {
  const [user] = useAuthState(auth);
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);
  const setAuthModalState = useSetAtom(authModalStateAtom);

  useEffect(() => {
    setCommunityStateValue((prev) => ({
      ...prev,
      currentCommunity: communityData,
    }));
  }, [communityData, setCommunityStateValue]);

  const currentCommunity =
    communityStateValue.currentCommunity || communityData;
  const { canPost, loading } = useCommunityPermissions(currentCommunity);

  if (loading) {
    return (
      <PageContent>
        <PostLoader />
        <></>
      </PageContent>
    );
  }

  if (!canPost) {
    return (
      <PageContent>
        <RestrictedCommunityBanner
          title="Restricted Access"
          description="Only subscribers can create posts in this community."
        />
        <About communityData={currentCommunity} />
      </PageContent>
    );
  }

  return (
    <PageContent>
      <>
        <Box p="14px 0px">
          <Text
            fontSize="20pt"
            fontWeight={700}
            color={{ base: "black", _dark: "white" }}
          >
            Create Post
          </Text>
        </Box>
        {user ? (
          <NewPostForm
            user={user}
            communityImageURL={currentCommunity.imageURL}
            currentCommunity={currentCommunity}
          />
        ) : (
          <Stack
            justifyContent="center"
            align="center"
            bg={{ base: "white", _dark: "gray.800" }}
            p={5}
            borderRadius={10}
          >
            <Text fontWeight={600}>Log in or sign up to post</Text>
            <Stack direction="row" gap={2} ml={4}>
              <AuthButtons />
            </Stack>
          </Stack>
        )}
      </>
      <>{currentCommunity && <About communityData={currentCommunity} />}</>
    </PageContent>
  );
};
export default SubmitPostPage;
