import ProfileModal from "@/components/modal/profile/ProfileModal";
import AuthButtons from "@/components/navbar/right-content/AuthButtons";
import { Flex, Textarea, Button, Text, Stack, Icon } from "@chakra-ui/react";
import { LuSend, LuTrash } from "react-icons/lu";
import { User } from "firebase/auth";
import React, { useState } from "react";

/**
 * Required props for CommentInput component
 * @param {string} commentText - text of the comment
 * @param {setCommentText} setCommentText - function to set the comment text
 * @param {User} user - User object from firebase
 * @param {boolean} createLoading - is the comment being created
 * @param {onCreateComment} onCreateComment - function to handle creating comment
 */
type CommentInputProps = {
  commentText: string;
  setCommentText: (value: string) => void;
  user?: User | null;
  createLoading: boolean;
  onCreateComment: (commentText: string) => void;
};

/**
 * Input box for creating a comment by inputting text.
 * The component displays:
 *  - Textarea for inputting comment text
 *  - Button for creating the comment
 *
 * If the user is not logged in, the component displays:
 *  - Text prompting the user to log in or sign up
 *  - AuthButtons component
 *
 * @param {string} commentText - text of the comment
 * @param {setCommentText} setCommentText - function to set the comment text
 * @param {User} user - User object from firebase
 * @param {boolean} createLoading - is the comment being created
 * @param {onCreateComment} onCreateComment - function to handle creating comment
 *
 * @returns {React.FC<CommentInputProps>} - input box for creating a comment
 */
const CommentInput: React.FC<CommentInputProps> = ({
  commentText,
  setCommentText,
  user,
  createLoading,
  onCreateComment,
}) => {
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  return (
    <Flex direction="column" position="relative">
      {user ? (
        // If the user is logged in, display the comment input box
        <>
          <ProfileModal
            handleClose={() => setProfileModalOpen(false)}
            open={isProfileModalOpen}
          />
          <Stack direction="row" align="center" gap={1} mb={2}>
            <Text color={{ base: "gray.600", _dark: "gray.400" }}>
              Comment as
            </Text>
            <Text
              color={{ base: "gray.600", _dark: "gray.400" }}
              fontSize="10pt"
              _hover={{
                cursor: "pointer",
                textDecoration: "underline",
                color: { base: "red.500", _dark: "red.400" },
              }}
              onClick={() => setProfileModalOpen(true)}
            >
              {user?.email?.split("@")[0]}
            </Text>
          </Stack>

          <Flex
            direction="column"
            bg={{ base: "white", _dark: "gray.800" }}
            borderRadius="xl"
            border="1px solid"
            borderColor={{ base: "gray.200", _dark: "gray.600" }}
            overflow="hidden"
            _focusWithin={{
              borderColor: { base: "black", _dark: "gray.200" },
              boxShadow: {
                base: "0 0 0 1px black",
                _dark: "0 0 0 1px gray.200",
              },
            }}
          >
            <Textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="What are your thoughts?"
              fontSize="11pt"
              minHeight="100px"
              border="none"
              _focus={{ outline: "none", border: "none", boxShadow: "none" }}
              p={4}
              bg="transparent"
              _placeholder={{ color: "gray.500" }}
            />

            <Flex
              bg={{ base: "gray.50", _dark: "gray.700" }}
              p={2}
              justify="flex-end"
              align="center"
              borderTop="1px solid"
              borderColor={{ base: "gray.100", _dark: "gray.600" }}
            >
              <Stack direction="row" gap={2} align="center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentText("")}
                  disabled={!commentText.length}
                >
                  <Icon as={LuTrash} mr={2} />
                  Clear
                </Button>

                <Button
                  disabled={!commentText.length}
                  loading={createLoading}
                  borderRadius={"xl"}
                  onClick={() => onCreateComment(commentText)}
                >
                  <Icon as={LuSend} mr={2} />
                  Comment
                </Button>
              </Stack>
            </Flex>
          </Flex>
        </>
      ) : (
        // If the user is not logged in, display the login/signup prompt
        <Flex
          align="center"
          justify="space-between"
          borderRadius={2}
          border="1px solid"
          borderColor={{ base: "gray.100", _dark: "gray.700" }}
          p={4}
        >
          <Text fontWeight={600}>Log in or sign up to comment</Text>
          <AuthButtons />
        </Flex>
      )}
    </Flex>
  );
};
export default CommentInput;
