"use client";

import { useState } from "react";
import PageContent from "@/components/layout/PageContent";
import Posts from "@/components/posts/Posts";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { Community } from "@/types/community";
import React from "react";
import CommunityHeader from "@/components/community/CommunityHeader";
import useCommunityState from "@/hooks/community/useCommunityState";
import useCommunityMembershipActions from "@/hooks/community/useCommunityMembershipActions";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";
import InlineComposer from "@/components/posts/composer/InlineComposer";
import RestrictedComposerNotice from "@/components/posts/composer/RestrictedComposerNotice";

type CommunityPageProps = {
  communityId: string;
};

export default function CommunityClient({ communityId }: CommunityPageProps) {
  const { data: communityData } = useCommunityDataQuery({ communityId });
  const currentCommunity = (communityData ?? { id: communityId }) as Community;
  const { canView, canPost, loading } = useCommunityPermissions(currentCommunity);

  const { communityStateValue } = useCommunityState();
  const { onJoinOrLeaveCommunity, loading: membershipLoading } = useCommunityMembershipActions();
  const isJoined = !!communityStateValue.mySnippets.find(
    (item) => item.communityId === currentCommunity.id
  );
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);

  const handleJoinOrLeave = () => {
    if (isJoined) {
      setLeaveConfirmationOpen(true);
    } else {
      onJoinOrLeaveCommunity(currentCommunity, isJoined);
    }
  };

  const onConfirmLeave = async () => {
    await onJoinOrLeaveCommunity(currentCommunity, isJoined);
    setLeaveConfirmationOpen(false);
  };

  if (!communityData) {
    return (
      <PageContent>
        <PostLoader />
      </PageContent>
    );
  }

  return (
    <>
      <CommunityHeader
        community={currentCommunity}
        isJoined={isJoined}
        onToggleJoin={handleJoinOrLeave}
      />
      <PageContent>
        <>
          {loading ? (
            <PostLoader />
          ) : canView ? (
            <>
              {canPost ? (
                <InlineComposer communityId={communityId} />
              ) : (
                <RestrictedComposerNotice communityId={communityId} />
              )}
              <Posts communityData={currentCommunity} />
            </>
          ) : (
            <RestrictedCommunityBanner />
          )}
        </>
      </PageContent>
      <ConfirmationDialog
        open={leaveConfirmationOpen}
        onClose={() => setLeaveConfirmationOpen(false)}
        onConfirm={onConfirmLeave}
        title="Unsubscribe from Community"
        body={`Are you sure you want to unsubscribe from c/${currentCommunity.id}?`}
        confirmButtonText="Unsubscribe"
        isLoading={membershipLoading}
      />
    </>
  );
}
