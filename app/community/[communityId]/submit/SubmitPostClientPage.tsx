"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import AuthButtons from "@/components/navbar/right-content/AuthButtons";
import NewPostForm from "@/components/posts/new-post-form/NewPostForm";
import { useSession } from "@/lib/auth-client";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { Community } from "@/types/community";
import { Box, Stack, Text } from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import PostLoader from "@/components/loaders/post-loader/PostLoader";

type SubmitPostPageProps = {
  communityId: string;
};

const SubmitPostPage: React.FC<SubmitPostPageProps> = ({ communityId }) => {
  const { data: communityData } = useCommunityDataQuery({ communityId });
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);

  useEffect(() => {
    if (communityData) {
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: communityData as Community,
      }));
    }
  }, [communityData, setCommunityStateValue]);

  const fallbackCommunity = (communityData ?? {
    id: communityId,
  }) as Community;
  const currentCommunity =
    communityStateValue.currentCommunity ?? fallbackCommunity;
  const { canPost, loading } = useCommunityPermissions(currentCommunity);

  if (loading || !communityData) {
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
            communityImageURL={currentCommunity.imageUrl}
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
