"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import CreatePostLink from "@/components/community/CreatePostLink";
import About from "@/components/community/about/About";
import CommunityHeader from "@/components/community/community-header/CommunityHeader";
import PageContent from "@/components/layout/PageContent";
import Posts from "@/components/posts/Posts";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import { Community } from "@/types/community";
import { Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";

type CommunityPageProps = {
  communityData: Community;
};

/**
 * The client-side entry point for a community's main page.
 * Synchronizes server-fetched community data with the global state and renders the community header, post feed, and sidebar.
 * Handles permission checks to restrict access to private or restricted communities.
 * @param communityData - The initial community data fetched on the server.
 * @returns A structured layout containing the community's content and metadata.
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

  const { canView, loading } = useCommunityPermissions(currentCommunity);

  return (
    <>
      <CommunityHeader communityData={currentCommunity} />
      <PageContent>
        <>
          {loading ? (
            <PostLoader />
          ) : canView ? (
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
