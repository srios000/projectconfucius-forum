import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import { Flex, Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import PostItemError from "../../ui/ErrorMessage";
import VoteSection from "./VoteSection";
import PostDetails from "./PostDetails";
import PostTitle from "./PostTitle";
import PostBody from "./PostBody";
import PostActions from "./PostActions";

/**
 * @param {Post} post - post object
 * @param {boolean} userIsCreator - is the currently logged in user the creator of post
 * @param {number} userVoteValue - whether the currently logged in user has voted on the post (1, -1, or 0)
 * @param {function} onVote - function to handle voting
 * @param {function} onDeletePost - function to handle deleting post
 * @param {function} onSelectPost - function to handle selecting post
 * @param {boolean} showCommunityImage - whether to show the community image
 */
type PostItemProps = {
  post: Post;
  userIsCreator: boolean; // is the currently logged in user the creator of post
  userIsAdmin?: boolean; // is the currently logged in user an admin of the community
  userVoteValue?: number; // value of the vote of the currently logged in user
  onVote: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => void; // function to handle voting
  onDeletePost: (post: Post) => Promise<boolean>; // function to handle deleting post
  onSelectPost?: (post: Post) => void; // optional because once a post is selected it cannot be reselected
  showCommunityImage?: boolean;
};

/**
 * Component to display a post:
 *  - Post title
 *  - Post text
 *  - Post creator
 *  - Post community
 *  - Post vote count
 *  - Post vote buttons
 *  - Post delete button (if user is creator or admin)
 *  - Post select button (if post is not selected)
 *  - Post community image (if showCommunityImage is true)
 * @param {Post} post - post object
 * @param {boolean} userIsCreator - is the currently logged in user the creator of post
 * @param {boolean} userIsAdmin - is the currently logged in user an admin of the community
 * @param {number} userVoteValue - whether the currently logged in user has voted on the post (1, -1, or 0)
 * @param {function} onVote - function to handle voting
 * @param {function} onDeletePost - function to handle deleting post
 * @param {function} onSelectPost - function to handle selecting post
 * @param {boolean} showCommunityImage - whether to show the community image
 * @returns {React.FC<PostItemProps>} - card displaying post
 */
const PostItem: React.FC<PostItemProps> = ({
  post,
  userIsCreator,
  userIsAdmin = false,
  userVoteValue,
  onVote,
  onDeletePost,
  onSelectPost,
  showCommunityImage,
}) => {
  const [loadingImage, setLoadingImage] = useState(true);
  const [error, setError] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const router = useRouter();
  const showToast = useCustomToast();
  const { onSavePost, isPostSaved } = useSavedPosts();
  const isSaved = isPostSaved(post.id!);

  /**
   * If there is no selected post then post is already selected
   */
  const singlePostPage = !onSelectPost;

  /**
   * Will call the `handleDelete` from prop (usePosts hook).
   * This function provides the error handling for the delete functionality.
   * Each component may choose to the error handling differently.
   * Core functionality is shared.
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} event - click event on delete button to prevent from post being selected
   */
  const handleDelete = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation(); // stop event bubbling up to parent
    setLoadingDelete(true);
    try {
      const success: boolean = await onDeletePost(post); // call the delete function from usePosts hook

      if (!success) {
        // if the post was not deleted successfully
        throw new Error("Post could not be deleted"); // throw error
      }

      showToast({
        title: "Post Deleted",
        description: "Your post has been deleted",
        status: "success",
      });
      // if the user deletes post from the single post page, they should be redirected to the post's community page
      if (singlePostPage) {
        // if the post is on the single post page
        router.push(`/community/${post.communityId}`); // redirect to the community page
      }
    } catch (error: any) {
      setError(error.message);
      showToast({
        title: "Post not Deleted",
        description: "There was an error deleting your post",
        status: "error",
      });
    } finally {
      setLoadingDelete(false);
    }
  };

  /**
   * Added functionality to share a post by copying the link to the post to the clipboard.
   * Router will check base URL to copy the correct link depending on the name of the site.
   */
  const getPostLink = () => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/community/${post.communityId}/comments/${post.id}`;
  };

  const handleSave = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    await onSavePost(post);
  };

  return (
    <Flex
      border="1px solid"
      bg={{ base: "white", _dark: "gray.800" }}
      borderColor={{ base: "gray.300", _dark: "gray.700" }}
      borderRadius={"xl"}
      _hover={{
        borderColor: singlePostPage
          ? "none"
          : { base: "gray.400", _dark: "gray.600" },
        boxShadow: singlePostPage ? undefined : "sm",
      }}
      cursor={singlePostPage ? "unset" : "pointer"}
      onClick={() => onSelectPost && onSelectPost(post)} // if a post is selected then open post
      shadow="md"
    >
      {/* Left Section */}
      <Flex
        direction="column"
        align="center"
        bg={singlePostPage ? "none" : { base: "gray.100", _dark: "gray.700" }}
        p={2}
        width="40px"
        borderRadius={singlePostPage ? "0" : "10px 0px 0px 10px"}
      >
        <VoteSection
          userVoteValue={userVoteValue}
          onVote={onVote}
          post={post}
        />
      </Flex>

      {/* Right Section  */}
      <Flex direction="column" width="100%">
        <Stack gap={1} p="12px">
          <PostDetails showCommunityImage={true} post={post} />
          <PostTitle post={post} />
          <PostBody
            post={post}
            loadingImage={loadingImage}
            setLoadingImage={setLoadingImage}
          />
        </Stack>
        <PostActions
          handleDelete={handleDelete}
          loadingDelete={loadingDelete}
          userIsCreator={userIsCreator}
          userIsAdmin={userIsAdmin}
          postLink={getPostLink()}
          handleSave={handleSave}
          isSaved={isSaved}
          showToast={showToast}
        />
        <PostItemError
          error={error}
          message={"There was an error when loading this post"}
        />
      </Flex>
    </Flex>
  );
};
export default PostItem;
