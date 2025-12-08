import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import React from "react";

/**
 * Fallback page for unknown routes with quick links back to core pages.
 * @returns Centered message and navigation buttons.
 */
const PageNotFound: React.FC = () => {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color={{ base: "gray.600", _dark: "gray.400" }}
      >
        Sorry, this page does not exist!
      </Text>
      <Stack direction="row" gap={4} mt={4}>
        <Link href="/">
          <Button mt={4} width="150px">
            Home
          </Button>
        </Link>
        <Link href="/communities">
          <Button mt={4} width="150px">
            All Communities
          </Button>
        </Link>
      </Stack>
    </Flex>
  );
};

export default PageNotFound;
