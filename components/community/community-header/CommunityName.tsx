import React from "react";
import { Flex, Text } from "@chakra-ui/react";

type CommunityNameProps = {
  id: string;
};

const CommunityName: React.FC<CommunityNameProps> = ({ id }) => {
  return (
    <Flex direction="column" mr={6}>
      <Text fontWeight={800} fontSize="16pt">
        {id}
      </Text>
    </Flex>
  );
};

export default CommunityName;
