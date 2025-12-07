"use client";

import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/Community/about/About";
import CreatePostLink from "@/components/Community/CreatePostLink";
import Header from "@/components/Community/Header";
import PageContent from "@/components/Layout/PageContent";
import Posts from "@/components/Posts/Posts";
import { useAtom } from "jotai";
import React, { useEffect } from "react";

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
      <Header communityData={currentCommunity} />
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
