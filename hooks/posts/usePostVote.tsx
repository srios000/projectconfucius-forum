/* eslint-disable react-hooks/exhaustive-deps */
import { authModalStateAtom } from "@/atoms/authModalAtom";
import { auth } from "@/firebase/clientApp";
import { useSetAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post, PostVote } from "@/types/post";
import { handlePostVote } from "@/lib/posts/handlePostVote";
import { getPostVotes as getPostVotesLib } from "@/lib/posts/getPostVotes";
import { getPost as getPostLib } from "@/lib/posts/getPost";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

/**
 * Manages voting interactions on posts and keeps local vote state aligned with Firestore.
 * @param postStateValue - Current post state containing posts and cached votes.
 * @param setPostStateValue - Setter used to update posts, votes, and selected post.
 * @returns Handlers to vote on a post, load votes for a set of posts, or fetch a single post.
 */
const usePostVote = (
  postStateValue: {
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  },
  setPostStateValue: SetPostState
) => {
  const [user] = useAuthState(auth);
  const setAuthModalState = useSetAtom(authModalStateAtom);
  const showToast = useCustomToast();

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => {
    event.stopPropagation();

    if (!user?.uid) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    try {
      const { voteStatus } = post;
      const existingVote = postStateValue.postVotes.find(
        (v) => v.postId === post.id
      );

      const { voteChange, newVote, voteIdToDelete } = await handlePostVote(
        user.uid,
        post,
        vote,
        communityId,
        existingVote
      );

      let updatedPostVotes = [...postStateValue.postVotes];
      const updatedPost = { ...post, voteStatus: voteStatus + voteChange };
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
      const postVotes = await getPostVotesLib(user.uid, postIds);

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
      const post = await getPostLib(postId);
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
