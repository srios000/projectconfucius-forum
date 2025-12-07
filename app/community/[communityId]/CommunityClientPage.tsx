"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/community/about/About";
import CreatePostLink from "@/components/community/CreatePostLink";
import CommunityHeader from "@/components/community/community-header/CommunityHeader";
import PageContent from "@/components/layout/PageContent";
import Posts from "@/components/posts/Posts";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { Community } from "@/types/community";

type CommunityPageProps = {
  communityData: Community;
};

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

  const currentCommunity =
    communityStateValue.currentCommunity?.id === communityData.id
      ? communityStateValue.currentCommunity
      : communityData;

  return (
    <>
      <CommunityHeader communityData={currentCommunity} />
      <PageContent>
        <>
          <CreatePostLink />
          <Posts communityData={currentCommunity} />
        </>
        <>
          <About communityData={currentCommunity} />
        </>
      </PageContent>
    </>
  );
};

export default CommunityClientPage;
