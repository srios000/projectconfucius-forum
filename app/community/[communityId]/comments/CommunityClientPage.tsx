"use client";

import CreatePostLink from "@/components/community/CreatePostLink";
import About from "@/components/community/about/About";
import CommunityHeader from "@/components/community/community-header/CommunityHeader";
import PageContent from "@/components/layout/PageContent";
import Posts from "@/components/posts/Posts";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useCommunityState from "@/hooks/community/useCommunityState";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { Community } from "@/types/community";
import { Stack } from "@chakra-ui/react";
import React, { useEffect } from "react";

type CommunityPageProps = {
  communityId: string;
};

const CommunityClientPage: React.FC<CommunityPageProps> = ({ communityId }) => {
  const { data: communityData } = useCommunityDataQuery({ communityId });
  const { communityStateValue, setCommunityStateValue } = useCommunityState();

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
  const currentCommunity: Community =
    communityStateValue.currentCommunity?.id === fallbackCommunity.id
      ? communityStateValue.currentCommunity
      : fallbackCommunity;

  const { canView, loading } = useCommunityPermissions(currentCommunity);

  if (!communityData) {
    return (
      <PageContent>
        <PostLoader />
        <></>
      </PageContent>
    );
  }

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
