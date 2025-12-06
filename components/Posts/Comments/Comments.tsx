/* eslint-disable react-hooks/exhaustive-deps */
import { Post } from "@/atoms/postsAtom";
import useComments from "@/hooks/useComments";
import {
  Box,
  Flex,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import { User } from "firebase/auth";
import React, { useState } from "react";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";

/**
 * Required props for Comments component
 * @param {User} user - User object from firebase
 * @param {Post} selectedPost - Post object from firebase
 * @param {string} communityId - id of the community
 */
type CommentsProps = {
  user?: User;
  selectedPost: Post | null;
  communityId: string;
  isCommunityAdmin?: boolean;
};

/**
 * Displays all the comments for a post.
 * Allows user to create, edit and delete comments.
 *
 * If there are no comments, displays a message.
 * Show loading skeleton while fetching comments.
 * If everything is loaded, show the comments.
 * @param {User} user - User object from firebase
 * @param {Post} selectedPost - Post object from firebase
 * @param {string} communityId - id of the community
 *
 * @returns {React.FC<CommentsProps>} - Comments component
 */
const Comments: React.FC<CommentsProps> = ({
  user,
  selectedPost,
  communityId,
  isCommunityAdmin,
}) => {
  const [commentText, setCommentText] = useState("");
  const {
    comments,
    onCreateComment,
    onDeleteComment,
    commentFetchLoading,
    createLoading,
    deleteLoadingId,
  } = useComments(selectedPost);

  const handleCreateComment = async () => {
    await onCreateComment(user!, commentText);
    setCommentText("");
  };

  return (
    <Flex
      direction="column"
      border="1px solid"
      borderColor={{ base: "gray.300", _dark: "gray.700" }}
      bg={{ base: "white", _dark: "gray.800" }}
      borderRadius={10}
      pt={4}
      shadow="md"
    >
      <Flex
        direction="column"
        pl={10}
        pr={4}
        mb={6}
        fontSize="10pt"
        width="100%"
      >
        <CommentInput
          commentText={commentText}
          setCommentText={setCommentText}
          user={user}
          createLoading={createLoading}
          onCreateComment={handleCreateComment}
        />
      </Flex>
      <Stack gap={4} m={4} ml={10}>
        {commentFetchLoading ? (
          <>
            {[0, 1, 2, 3].map((item) => (
              <Box
                key={item}
                padding="6"
                bg={{ base: "white", _dark: "gray.800" }}
              >
                <SkeletonCircle size="10" />
                <SkeletonText mt="4" noOfLines={3} rootProps={{ gap: 4 }} />
              </Box>
            ))}
          </>
        ) : (
          <>
            {comments.length === 0 ? (
              <Flex direction="column" justify="center" align="center" p={20}>
                <Text fontWeight={600} opacity={0.3}>
                  {" "}
                  No Comments
                </Text>
              </Flex>
            ) : (
              <>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDeleteComment={onDeleteComment}
                    loadingDelete={deleteLoadingId === comment.id}
                    userId={user?.uid}
                    isCommunityAdmin={isCommunityAdmin}
                  />
                ))}
              </>
            )}
          </>
        )}
      </Stack>
    </Flex>
  );
};
export default Comments;
