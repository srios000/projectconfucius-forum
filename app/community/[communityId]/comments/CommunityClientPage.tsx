"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import CreatePostLink from "@/components/community/CreatePostLink";
import About from "@/components/community/about/About";
import CommunityHeader from "@/components/community/community-header/CommunityHeader";
import PageContent from "@/components/layout/PageContent";
import Posts from "@/components/posts/Posts";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { Community } from "@/types/community";
import { Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";

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
            <RestrictedCommunityBanner />
          )}
        </>
        <>{canView && <About communityData={currentCommunity} />}</>
      </PageContent>
    </>
  );
};

export default CommunityClientPage;
