"use client";

import { authModalStateAtom } from "@/atoms/authModalAtom";
import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/Community/About";
import PageContent from "@/components/Layout/PageContent";
import AuthButtons from "@/components/Navbar/RightContent/AuthButtons";
import NewPostForm from "@/components/Posts/NewPostForm";
import { auth } from "@/firebase/clientApp";
import { Box, Stack, Text } from "@chakra-ui/react";
import { useAtom, useSetAtom } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

type SubmitPostPageProps = {
  communityData: Community;
};

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
