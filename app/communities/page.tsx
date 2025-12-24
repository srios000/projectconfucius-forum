"use client";

import CommunityItem from "@/components/community/community-item/CommunityItem";
import PersonalHome from "@/components/community/PersonalHome";
import PageContent from "@/components/layout/PageContent";
import CommunityLoader from "@/components/loaders/CommunityLoader";
import useCommunitiesFeed from "@/hooks/community/useCommunitiesFeed";
import useCommunityState from "@/hooks/community/useCommunityState";
import useCommunityMembershipActions from "@/hooks/community/useCommunityMembershipActions";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Box, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import React, { useEffect, useMemo } from "react";
import { Community } from "@/types/community";

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
  const observerOptions = useMemo(() => ({ threshold: 0.5 }), []);
  const { ref, isIntersecting } = useIntersectionObserver(observerOptions);

  useEffect(() => {
    if (isIntersecting && !loading && !noMoreCommunities) {
      fetchCommunities(false);
    }
  }, [isIntersecting, loading, noMoreCommunities, fetchCommunities]);

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
          if (snippet.isAdmin) {
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
    <>
      <PageContent>
        <>
          <Stack direction="column" borderRadius={10} gap={3}>
            {loading && communities.length === 0 ? (
              <Stack mt={2} p={3}>
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <CommunityLoader key={index} />
                  ))}
              </Stack>
            ) : (
              <Stack gap={5}>
                {adminCommunities.length > 0 && (
                  <Box>
                    <Heading fontSize="md" mb={2} px={2}>
                      Moderating
                    </Heading>
                    <Stack gap={2}>
                      {adminCommunities.map((community) => (
                        <CommunityItem
                          key={community.id}
                          community={community}
                          isJoined={true}
                          onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {subscribedCommunities.length > 0 && (
                  <Box>
                    <Heading fontSize="md" mb={2} px={2}>
                      My Communities
                    </Heading>
                    <Stack gap={2}>
                      {subscribedCommunities.map((community) => (
                        <CommunityItem
                          key={community.id}
                          community={community}
                          isJoined={true}
                          onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {notSubscribedCommunities.length > 0 && (
                  <Box>
                    <Heading fontSize="md" mb={2} px={2}>
                      Discover Communities
                    </Heading>
                    <Stack gap={2}>
                      {notSubscribedCommunities.map((community) => (
                        <CommunityItem
                          key={community.id}
                          community={community}
                          isJoined={false}
                          onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
            {!noMoreCommunities ? (
              <Box
                ref={ref}
                height="20px"
                display="flex"
                justifyContent="center"
                alignItems="center"
                p={2}
              >
                {loading && <Spinner size="sm" />}
              </Box>
            ) : (
              <Text textAlign="center" p={2} fontSize="sm" color="gray.500">
                No more communities
              </Text>
            )}
          </Stack>
        </>
        <Stack gap={2}>
          <PersonalHome />
        </Stack>
        <></>
      </PageContent>
    </>
  );
};
export default Communities;
