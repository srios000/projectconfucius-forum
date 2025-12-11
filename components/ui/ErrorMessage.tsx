import {
  Flex,
  AlertContent,
  AlertIndicator,
  AlertRoot,
  Text,
} from "@chakra-ui/react";
import React from "react";

interface PostItemErrorProps {
  error: boolean;
  message: string;
}

/**
 * Shows a compact error alert when a list item fails to load.
 * @param props - Error flag and message to display.
 * @returns Alert container or null when no error.
 */
const PostItemError: React.FC<PostItemErrorProps> = ({ error, message }) => {
  return (
    <>
      {error && (
        <Flex align="center" justifyContent="center">
          <AlertRoot status="error" borderRadius={10} m={2} width="95%">
            <AlertIndicator />
            <AlertContent>
              <Text
                mr={2}
                fontWeight={600}
                color={{ base: "red.500", _dark: "red.400" }}
              >
                {message}
              </Text>
            </AlertContent>
          </AlertRoot>
        </Flex>
      )}
    </>
  );
};

export default PostItemError;
