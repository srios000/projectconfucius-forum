/* eslint-disable react-hooks/exhaustive-deps */
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post, PostVote } from "@/types/post";
import { voteAction, getPostVotesAction } from "@/app/actions/posts";
import { getPostAction, getCommunityDataAction } from "@/app/actions/reads";
import useCommunityState from "../community/useCommunityState";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

/**
 * A custom hook that manages the voting logic for posts.
 * It handles permission checks for restricted communities, processes upvotes and downvotes,
 * and synchronizes the local post state with the backend voting results.
 * @param postStateValue - The current state of posts and their associated votes.
 * @param setPostStateValue - A state setter function to update the global post state.
 * @returns An object containing functions for voting, loading votes, and fetching post data.
 */
const usePostVote = (
  postStateValue: {
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  },
  setPostStateValue: SetPostState
) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const { communityStateValue } = useCommunityState();

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => {
    event.stopPropagation();

    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }

    // Check permissions
    const isMember = !!communityStateValue.mySnippets.find(
      (snippet) => snippet.communityId === communityId
    );

    if (!isMember) {
      let community = communityStateValue.currentCommunity;

      if (!community || community.id !== communityId) {
        try {
          community = (await getCommunityDataAction(communityId)) ?? undefined;
        } catch (error) {
          console.log(
            "Error fetching community data for vote permission",
            error
          );
        }
      }

      if (
        community &&
        (community.privacyType === "restricted" ||
          community.privacyType === "private")
      ) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to vote in this community.",
          status: "error",
        });
        return;
      }
    }

    try {
      const existingVote = postStateValue.postVotes.find(
        (v) => v.postId === post.id
      );

      const { voteChange, newVote, voteIdToDelete } = await voteAction(
        post,
        vote,
        communityId,
        existingVote
      );

      let updatedPostVotes = [...postStateValue.postVotes];
      const updatedPost = { ...post, voteStatus: post.voteStatus + voteChange };
      const updatedPosts = [...postStateValue.posts];

      if (voteIdToDelete) {
        updatedPostVotes = updatedPostVotes.filter(
          (v) => v.id !== voteIdToDelete
        );
      } else if (newVote) {
        if (existingVote) {
          const voteIndexPosition = postStateValue.postVotes.findIndex(
            (v) => v.id === existingVote.id
          );
          updatedPostVotes[voteIndexPosition] = newVote;
        } else {
          updatedPostVotes = [...updatedPostVotes, newVote];
        }
      }

      const postIndexPosition = postStateValue.posts.findIndex(
        (item) => item.id === post.id
      );
      updatedPosts[postIndexPosition] = updatedPost;
      setPostStateValue((prev) => ({
        ...prev,
        posts: updatedPosts,
        postVotes: updatedPostVotes,
      }));

      if (postStateValue.selectedPost) {
        setPostStateValue((prev) => ({
          ...prev,
          selectedPost: updatedPost,
        }));
      }
    } catch (error) {
      console.log("Error: onVote", error);
      showToast({
        title: "Could not Vote",
        description: "There was an error voting on the post",
        status: "error",
      });
    }
  };

  const getPostVotes = async (postIds: string[]) => {
    if (!user || !postIds.length) return;
    try {
      const postVotes = await getPostVotesAction(postIds);

      setPostStateValue((prev) => ({
        ...prev,
        postVotes: postVotes as PostVote[],
      }));
    } catch (error) {
      console.log("Error: getPostVotes", error);
      showToast({
        title: "Could not Get Post Votes",
        description: "There was an error while getting your post votes",
        status: "error",
      });
    }
  };

  const getPost = async (postId: string) => {
    try {
      const post = await getPostAction(postId);
      if (post) {
        setPostStateValue((prev) => ({
          ...prev,
          selectedPost: post,
        }));
        return post;
      }
      return null;
    } catch (error) {
      console.log("Error: getPost", error);
      return null;
    }
  };

  return { onVote, getPostVotes, getPost };
};

export default usePostVote;
