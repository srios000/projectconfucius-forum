import React from "react";
import { Community } from "@/types/community";
import { Flex, Image, Icon, Text } from "@chakra-ui/react";
import { IoPeopleCircleOutline } from "react-icons/io5";

type CommunityItemNameIconSectionProps = {
  community: Community;
};

/**
 * Renders the avatar and name for a community row.
 * @param community - Community entity with id and optional imageURL.
 * @returns Flex row with icon and title text.
 */
const CommunityItemNameIconSection: React.FC<
  CommunityItemNameIconSectionProps
> = ({ community }) => {
  return (
    <Flex align="center" width="100%">
      <Flex align="center" direction="row">
        {community.imageURL ? (
          <Image
            src={community.imageURL}
            borderRadius="full"
            boxSize="35px"
            mr={4}
            alt="Community Icon"
          />
        ) : (
          <Icon
            as={IoPeopleCircleOutline}
            fontSize={38}
            color="red.500"
            mr={4}
          />
        )}
        <Text fontSize={16}>{community.id}</Text>
      </Flex>
    </Flex>
  );
};

export default CommunityItemNameIconSection;
