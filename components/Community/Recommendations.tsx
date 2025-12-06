import useCommunitiesFeed from "@/hooks/useCommunitiesFeed";
import useCommunityData from "@/hooks/useCommunityData";
import {
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Skeleton,
  SkeletonCircle,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { IoPeopleCircleOutline } from "react-icons/io5";

/**
 * Displays the top 5 communities with the most members.
 * @returns {React.FC} - the recommendations component.
 */
const Recommendations: React.FC = () => {
  const { communityStateValue, onJoinOrLeaveCommunity } = useCommunityData();
  const { communities, loading } = useCommunitiesFeed({ limitValue: 5 });
  const router = useRouter();

  return (
    <Flex
      direction="column"
      position="relative"
      bg={{ base: "white", _dark: "gray.800" }}
      borderRadius="lg"
      border="1px solid"
      borderColor={{ base: "gray.300", _dark: "gray.700" }}
      shadow="md"
    >
      <SuggestionsHeader />

      <Flex direction="column">
        {loading ? (
          <Stack mt={2} p={3}>
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <Flex justify="space-between" align="center" key={index}>
                  <SkeletonCircle size="10" />
                  <Skeleton height="10px" width="70%" />
                </Flex>
              ))}
          </Stack>
        ) : (
          <>
            {communities.map((item, index) => {
              const isJoined = !!communityStateValue.mySnippets.find(
                (snippet) => snippet.communityId === item.id
              );
              return (
                <Link key={item.id} href={`/community/${item.id}`}>
                  <Flex
                    align="center"
                    justify="space-between"
                    fontSize="10pt"
                    p="10px 12px"
                  >
                    <Flex align="center" gap={2} minWidth={0} flex={1} mr={2}>
                      <Text flexShrink={0} width="20px">
                        {index + 1}
                      </Text>
                      {item.imageURL ? (
                        <Image
                          src={item.imageURL}
                          borderRadius="full"
                          boxSize="28px"
                          alt="Community Icon"
                          flexShrink={0}
                        />
                      ) : (
                        <Icon
                          as={IoPeopleCircleOutline}
                          fontSize={34}
                          color="red.500"
                          flexShrink={0}
                        />
                      )}
                      <Text
                        fontWeight={600}
                        fontSize="10pt"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {item.id}
                      </Text>
                    </Flex>
                    <Button
                      height="24px"
                      fontSize="8pt"
                      px={4}
                      variant={isJoined ? "outline" : "solid"}
                      flexShrink={0}
                      onClick={(event) => {
                        event.preventDefault();
                        onJoinOrLeaveCommunity(item, isJoined);
                      }}
                    >
                      {isJoined ? "Unsubscribe" : "Subscribe"}
                    </Button>
                  </Flex>
                </Link>
              );
            })}
          </>
        )}
        <Box p="10px 20px">
          <Button
            height="30px"
            width="100%"
            onClick={() => {
              router.push(`/communities`);
            }}
          >
            View All
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};
export default Recommendations;

/**
 * Displays the header for the Recommendations component.
 * Header includes the title "Top Communities" and a banner image with a gradient.
 * @returns {React.FC} - Recommendations header component
 */
const SuggestionsHeader: React.FC = () => {
  const bannerImage = "/images/banners/large.png";
  return (
    <Flex
      align="flex-end"
      color="white"
      p="6px 10px"
      height="70px"
      borderTopRadius="lg"
      fontWeight={700}
      bgImage="linear-gradient(to bottom, rgba(139, 0, 0, 0), rgba(139, 0, 0, 0.75)), url('/images/banners/large.png')"
      backgroundSize="cover"
    >
      Top Communities
    </Flex>
  );
};
