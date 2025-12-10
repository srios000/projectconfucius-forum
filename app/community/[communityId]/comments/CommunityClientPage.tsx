"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import CreatePostLink from "@/components/community/CreatePostLink";
import About from "@/components/community/about/About";
import CommunityHeader from "@/components/community/community-header/CommunityHeader";
import PageContent from "@/components/layout/PageContent";
import Posts from "@/components/posts/Posts";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import { Community } from "@/types/community";
import { Flex, Text, Icon, Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { FaLock } from "react-icons/fa";

type CommunityPageProps = {
  communityData: Community;
};

/**
 * Client-side community page wiring header, posts feed, and about sidebar.
 * @param communityData - Community data fetched on the server.
 * @returns Community layout with feed and management panels.
 */
const CommunityClientPage: React.FC<CommunityPageProps> = ({
  communityData,
}) => {
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);

  useEffect(() => {
    if (communityData) {
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: communityData,
      }));
    }
  }, [communityData, setCommunityStateValue]);

  const currentCommunity: Community =
    communityStateValue.currentCommunity?.id === communityData.id
      ? communityStateValue.currentCommunity
      : communityData;

  const { canView } = useCommunityPermissions(currentCommunity);

  return (
    <>
      <CommunityHeader communityData={currentCommunity} />
      <PageContent>
        <>
          {canView ? (
            <>
              <CreatePostLink />
              <Posts communityData={currentCommunity} />
            </>
          ) : (
            <Flex
              direction="column"
              justify="center"
              align="center"
              border="1px solid"
              borderColor={{ base: "gray.300", _dark: "gray.600" }}
              borderRadius={"xl"}
              p={10}
              bg={{ base: "white", _dark: "gray.800" }}
            >
              <Icon as={FaLock} fontSize={50} color="gray.400" mb={4} />
              <Text fontWeight={600} fontSize="lg">
                This community is private
              </Text>
              <Text color="gray.500">
                Posts are only available to subscribers.
              </Text>
            </Flex>
          )}
        </>
        <>{canView && <About communityData={currentCommunity} />}</>
      </PageContent>
    </>
  );
};

export default CommunityClientPage;
