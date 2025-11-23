"use client";

import { Community } from "@/atoms/communitiesAtom";
import CommunityItem from "@/components/Community/CommunityItem";
import PersonalHome from "@/components/Community/PersonalHome";
import PageContent from "@/components/Layout/PageContent";
import CommunityLoader from "@/components/Loaders/CommunityLoader";
import { firestore } from "@/firebase/clientApp";
import useCommunityData from "@/hooks/useCommunityData";
import useCustomToast from "@/hooks/useCustomToast";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Box, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Displays the communities page with the top 5 communities.
 * Pressing the "See More" button will display the next 5 communities.
 * @returns {React.FC} - the communities page with the top 5 communities.
 */
const Communities: React.FC = () => {
  const { communityStateValue, onJoinOrLeaveCommunity } = useCommunityData();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const showToast = useCustomToast();
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [noMoreCommunities, setNoMoreCommunities] = useState(false);
  const observerOptions = useMemo(() => ({ threshold: 0.5 }), []);
  const { ref, isIntersecting } = useIntersectionObserver(observerOptions);

  /**
   * Gets the top 5 communities with the most members.
   * @param {number} numberOfExtraPosts - number of extra posts to display
   */
  const getCommunities = async (initial = false) => {
    if (loading) return;
    setLoading(true);
    try {
      let communityQuery;
      if (initial) {
        communityQuery = query(
          collection(firestore, "communities"),
          orderBy("numberOfMembers", "desc"),
          limit(10)
        );
      } else {
        if (!lastVisible) return;
        communityQuery = query(
          collection(firestore, "communities"),
          orderBy("numberOfMembers", "desc"),
          startAfter(lastVisible),
          limit(10)
        );
      }

      const communityDocs = await getDocs(communityQuery);
      const communities = communityDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (communityDocs.docs.length < 10) setNoMoreCommunities(true);
      if (communityDocs.docs.length > 0)
        setLastVisible(communityDocs.docs[communityDocs.docs.length - 1]);

      setCommunities((prev) =>
        initial
          ? (communities as Community[])
          : [...prev, ...(communities as Community[])]
      );
    } catch (error) {
      console.log("Error: getCommunityRecommendations", error);
      showToast({
        title: "Could not Find Communities",
        description: "There was an error getting communities",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCommunities(true);
  }, []);

  useEffect(() => {
    if (isIntersecting && !loading && !noMoreCommunities && lastVisible) {
      getCommunities(false);
    }
  }, [isIntersecting, loading, noMoreCommunities, lastVisible]);

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
