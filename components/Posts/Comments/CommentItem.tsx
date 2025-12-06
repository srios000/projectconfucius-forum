import { Box, Flex, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Comment } from "@/hooks/useComments";
import { User } from "firebase/auth";
import CommentInput from "./CommentInput";

/**
 * Required props for CommentItem component
 * @param {Comment} comment - comment object
 * @param {onDeleteComment} onDeleteComment - function to handle deleting comment
 * @param {loadingDelete} loadingDelete - is the comment being deleted
 * @param {userId} userId - id of the currently logged in user
 */
type CommentItemProps = {
  comment: Comment;
  onDeleteComment: (comment: Comment) => void;
  loadingDelete: boolean;
  userId?: string;
  isCommunityAdmin?: boolean;
  onCreateComment: (
    user: User,
    text: string,
    parentId: string
  ) => Promise<void>;
  user?: User;
};

/**
 * Renders a comment item.
 * The components displays:
 *  - Comment text
 *  - Creator of the comment
 *  - Time the comment was created
 *  - Delete button if the currently logged in user is the creator of the comment
 *
 * @param {Comment} comment - comment object
 * @param {onDeleteComment} onDeleteComment - function to handle deleting comment
 * @param {loadingDelete} loadingDelete - is the comment being deleted
 * @param {userId} userId - id of the currently logged in user
 *
 * @returns {React.FC<CommentItemProps>} - comment item
 */
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDeleteComment,
  loadingDelete,
  userId,
  isCommunityAdmin,
  onCreateComment,
  user,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const handleReply = async () => {
    if (!user) return;
    setReplyLoading(true);
    await onCreateComment(user, replyText, comment.id);
    setReplyLoading(false);
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <Flex
      direction="column"
      border="1px solid"
      bg={{ base: "white", _dark: "gray.800" }}
      borderColor={{ base: "gray.300", _dark: "gray.700" }}
      borderRadius={10}
      shadow="sm"
      width="100%"
    >
      <Flex m={2}>
        <Box>
          <Icon as={CgProfile} fontSize={30} color="gray.300" mr={2} />
        </Box>
        <Stack gap={1} width="100%">
          <Stack direction="row" align="center" fontSize="8pt">
            <Text fontWeight={600}>{comment.creatorDisplayText}</Text>
            {/* <Text>{createdAtString}</Text> */}
            {loadingDelete && <Spinner size="sm" />}
          </Stack>
          <Text fontSize="10pt">{comment.text}</Text>
          <Stack
            direction="row"
            align="center"
            cursor="pointer"
            color={{ base: "gray.500", _dark: "gray.400" }}
          >
            <Text
              fontSize="10pt"
              _hover={{ color: { base: "blue.500", _dark: "blue.400" } }}
              onClick={() => setIsReplying(!isReplying)}
            >
              Reply
            </Text>
            {userId === comment.creatorId && (
              <Text
                fontSize="10pt"
                _hover={{ color: { base: "red.500", _dark: "red.400" } }}
              >
                Edit
              </Text>
            )}
            {(userId === comment.creatorId || isCommunityAdmin) && (
              <Text
                fontSize="10pt"
                _hover={{ color: { base: "red.500", _dark: "red.400" } }}
                onClick={() => onDeleteComment(comment)}
              >
                Delete
              </Text>
            )}
          </Stack>
          {isReplying && (
            <Box mt={2}>
              <CommentInput
                commentText={replyText}
                setCommentText={setReplyText}
                user={user}
                createLoading={replyLoading}
                onCreateComment={handleReply}
              />
            </Box>
          )}
        </Stack>
      </Flex>
    </Flex>
  );
};
export default CommentItem;
