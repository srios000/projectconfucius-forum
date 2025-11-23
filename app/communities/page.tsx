"use client";

import CommunityItem from "@/components/Community/CommunityItem";
import PersonalHome from "@/components/Community/PersonalHome";
import PageContent from "@/components/Layout/PageContent";
import CommunityLoader from "@/components/Loaders/CommunityLoader";
import useCommunitiesFeed from "@/hooks/useCommunitiesFeed";
import useCommunityData from "@/hooks/useCommunityData";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Box, Spinner, Stack, Text } from "@chakra-ui/react";
import React, { useEffect, useMemo } from "react";

/**
 * Displays the communities page with the top 5 communities.
 * Pressing the "See More" button will display the next 5 communities.
 * @returns {React.FC} - the communities page with the top 5 communities.
 */
const Communities: React.FC = () => {
  const { communityStateValue, onJoinOrLeaveCommunity } = useCommunityData();
  const { communities, loading, fetchCommunities, noMoreCommunities } =
    useCommunitiesFeed({ limitValue: 10, isPagination: true });
  const observerOptions = useMemo(() => ({ threshold: 0.5 }), []);
  const { ref, isIntersecting } = useIntersectionObserver(observerOptions);

  useEffect(() => {
    if (isIntersecting && !loading && !noMoreCommunities) {
      fetchCommunities(false);
    }
  }, [isIntersecting, loading, noMoreCommunities, fetchCommunities]);

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
              <>
                {communities.map((community, index) => {
                  const isJoined = !!communityStateValue.mySnippets.find(
                    (snippet) => snippet.communityId === community.id
                  );
                  return (
                    <CommunityItem
                      key={index}
                      community={community}
                      isJoined={isJoined}
                      onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                    />
                  );
                })}
              </>
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
