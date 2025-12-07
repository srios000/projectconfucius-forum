import React from "react";
import { Community } from "@/types/community";
import { Flex, Text } from "@chakra-ui/react";
import moment from "moment";

interface AboutCommunityProps {
  communityData: Community;
}

const AboutCommunity: React.FC<AboutCommunityProps> = ({ communityData }) => (
  <Flex width="100%" p={2} fontSize="10pt">
    <Flex direction="column" flexGrow={1}>
      <Text fontWeight={700}>Subscribers</Text>
      <Text>{communityData.numberOfMembers.toLocaleString()}</Text>
    </Flex>

    <Flex direction="column" flexGrow={1}>
      <Text fontWeight={700}>Created</Text>
      <Text>
        {communityData.createdAt &&
          moment(new Date(communityData.createdAt.seconds * 1000)).format(
            "MMM DD, YYYY"
          )}
      </Text>
    </Flex>
  </Flex>
);

export default AboutCommunity;
