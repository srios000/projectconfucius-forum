/* eslint-disable react-hooks/exhaustive-deps */
import { Community } from "@/atoms/communitiesAtom";
import { Post } from "@/atoms/postsAtom";
import { auth, firestore } from "@/firebase/clientApp";
import useCommunityData from "@/hooks/useCommunityData";
import useCommunityPermissions from "@/hooks/useCommunityPermissions";
import useCustomToast from "@/hooks/useCustomToast";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import usePosts from "@/hooks/usePosts";
import { Box, Spinner, Stack, Text } from "@chakra-ui/react";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import PostLoader from "../Loaders/PostLoader";
import PostItem from "./PostItem";

/**
 * @param {Community} communityData - Community object from firebase
 */
type PostsProps = {
  communityData: Community;
};

/**
 * Displays all the posts in a community.
 * Displays a list of `PostItem` components.
 * While the posts are being fetched, displays a loading skeleton.
 * @param {Community} communityData - Community object from firebase
 *
 * @returns {React.FC<PostsProps>} - Posts component
 */
const Posts: React.FC<PostsProps> = ({ communityData }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const {
    postStateValue,
    setPostStateValue,
    onVote,
    onDeletePost,
    onSelectPost,
  } = usePosts();
  const showToast = useCustomToast();
  const { isAdmin } = useCommunityPermissions(communityData);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const observerOptions = useMemo(() => ({ threshold: 0.5 }), []);
  const { ref, isIntersecting } = useIntersectionObserver(observerOptions);

  /**
   * Gets all posts in the community.
   *
   * @returns {Promise<void>} - void
   */
  const getPosts = async (initial = false) => {
    if (loading) return;
    try {
      setLoading(true);
      let postsQuery;

      if (initial) {
        postsQuery = query(
          collection(firestore, "posts"),
          where("communityId", "==", communityData.id),
          orderBy("createTime", "desc"),
          limit(10)
        );
      } else {
        if (!lastVisible) return; // Should not happen if logic is correct
        postsQuery = query(
          collection(firestore, "posts"),
          where("communityId", "==", communityData.id),
          orderBy("createTime", "desc"),
          startAfter(lastVisible),
          limit(10)
        );
      }

      const postDocs = await getDocs(postsQuery); // get all posts in community
      const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() })); // get all posts in community

      if (postDocs.docs.length < 10) {
        setNoMorePosts(true);
      }

      if (postDocs.docs.length > 0) {
        setLastVisible(postDocs.docs[postDocs.docs.length - 1]);
      }

      setPostStateValue((prev) => ({
        ...prev,
        posts: initial
          ? (posts as Post[])
          : [...prev.posts, ...(posts as Post[])],
      })); // set posts in state
    } catch (error: any) {
      console.log("Error: getPosts", error.message);
      showToast({
        title: "Posts not Loaded",
        description: "There was an error loading posts",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets all votes in the community when component mounts (page loads).
   */
  useEffect(() => {
    setNoMorePosts(false);
    setLastVisible(null);
    getPosts(true);
  }, [communityData]);

  useEffect(() => {
    if (isIntersecting && !loading && !noMorePosts && lastVisible) {
      getPosts(false);
    }
  }, [isIntersecting, loading, noMorePosts, lastVisible]);

  return (
    <>
      {/* If loading is true and it's the initial load (no posts yet), display the post loader component */}
      {loading && postStateValue.posts.length === 0 ? (
        <PostLoader />
      ) : (
        // If the posts are available, display the post item components
        <Stack gap={3}>
          {/* For each post (item) iterebly create a post car component */}
          {postStateValue.posts.map((item) => (
            <PostItem
              key={item.id}
              post={item}
              userIsCreator={user?.uid === item.creatorId}
              userIsAdmin={isAdmin}
              userVoteValue={
                postStateValue.postVotes.find((vote) => vote.postId === item.id)
                  ?.voteValue
              }
              onVote={onVote}
              onSelectPost={onSelectPost}
              onDeletePost={onDeletePost}
            />
          ))}
          {!noMorePosts ? (
            <Box
              ref={ref}
              height="20px"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              {loading && <Spinner size="sm" />}
            </Box>
          ) : (
            <Text textAlign="center" p={2} fontSize="sm" color="gray.500">
              No more posts
            </Text>
          )}
        </Stack>
      )}
    </>
  );
};
export default Posts;
