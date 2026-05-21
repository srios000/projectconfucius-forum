"use client";

import CommunityItem from "@/components/community/community-item/CommunityItem";
import PersonalHome from "@/components/community/PersonalHome";
import PageContent from "@/components/layout/PageContent";
import CommunityLoader from "@/components/loaders/CommunityLoader";
import useCommunitiesFeed from "@/hooks/community/useCommunitiesFeed";
import useCommunityState from "@/hooks/community/useCommunityState";
import useCommunityMembershipActions from "@/hooks/community/useCommunityMembershipActions";
import React, { useMemo } from "react";
import { Community } from "@/types/community";
import { Button } from "@/components/ui/button";

/**
 * A page that displays a comprehensive list of all communities.
 * Organizes communities into categories: those the user moderates, those they have joined, and others for discovery.
 * Implements infinite scrolling for efficient data loading.
 * @returns The communities directory page.
 */
const Communities: React.FC = () => {
  const { communityStateValue } = useCommunityState();
  const { onJoinOrLeaveCommunity } = useCommunityMembershipActions();
  const { communities, loading, fetchCommunities, noMoreCommunities } =
    useCommunitiesFeed({ limitValue: 10, isPagination: true });

  const [adminCommunities, subscribedCommunities, notSubscribedCommunities] =
    useMemo(() => {
      const admin: Community[] = [];
      const subscribed: Community[] = [];
      const notSubscribed: Community[] = [];

      communities.forEach((community) => {
        const snippet = communityStateValue.mySnippets.find(
          (s) => s.communityId === community.id
        );
        if (snippet) {
          if (snippet.isModerator) {
            admin.push(community);
          } else {
            subscribed.push(community);
          }
        } else {
          notSubscribed.push(community);
        }
      });

      return [admin, subscribed, notSubscribed];
    }, [communities, communityStateValue.mySnippets]);

  return (
    <PageContent>
      <div className="flex flex-col gap-3">
        {loading && communities.length === 0 ? (
          <div className="flex flex-col gap-2 mt-2 p-3">
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <CommunityLoader key={index} />
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {adminCommunities.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-2 px-2">
                  Moderating
                </h2>
                <div className="flex flex-col gap-2">
                  {adminCommunities.map((community) => (
                    <CommunityItem
                      key={community.id}
                      community={community}
                      isJoined={true}
                      onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                    />
                  ))}
                </div>
              </div>
            )}

            {subscribedCommunities.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-2 px-2">
                  My Communities
                </h2>
                <div className="flex flex-col gap-2">
                  {subscribedCommunities.map((community) => (
                    <CommunityItem
                      key={community.id}
                      community={community}
                      isJoined={true}
                      onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                    />
                  ))}
                </div>
              </div>
            )}

            {notSubscribedCommunities.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-2 px-2">
                  Discover Communities
                </h2>
                <div className="flex flex-col gap-2">
                  {notSubscribedCommunities.map((community) => (
                    <CommunityItem
                      key={community.id}
                      community={community}
                      isJoined={false}
                      onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!noMoreCommunities ? (
          <Button
            onClick={() => fetchCommunities(false)}
            disabled={loading}
            variant="outline"
            className="w-full my-4 h-9"
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        ) : (
          <p className="text-center p-2 text-sm text-muted-foreground">
            No more communities
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <PersonalHome />
      </div>
    </PageContent>
  );
};
export default Communities;
