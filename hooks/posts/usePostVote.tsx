/* eslint-disable react-hooks/exhaustive-deps */
import { uiAtom } from "@/atoms/uiAtom";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React, { useState } from "react";
import { Post, PostVote } from "@/types/post";
import { voteAction, getPostVotesAction } from "@/app/actions/posts";
import { getPostAction, getCommunityDataAction } from "@/app/actions/reads";
import useCommunityState from "../community/useCommunityState";
import { useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

type UsePostVoteOpts = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  postVotes: PostVote[];
  setPostVotes: (
    updater: PostVote[] | ((prev: PostVote[]) => PostVote[]),
  ) => void;
};

const usePostVote = ({
  posts,
  setPosts,
  postVotes,
  setPostVotes,
}: UsePostVoteOpts) => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const { communityStateValue } = useCommunityState();
  const setUi = useSetAtom(uiAtom);
  const queryClient = useQueryClient();

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string,
  ) => {
    event.stopPropagation();

    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }

    const isMember = !!communityStateValue.mySnippets.find(
      (snippet) => snippet.communityId === communityId,
    );

    if (!isMember) {
      let community = communityStateValue.currentCommunity;

      if (!community || community.id !== communityId) {
        try {
          community = (await getCommunityDataAction(communityId)) ?? undefined;
        } catch (error) {
          console.log(
            "Error fetching community data for vote permission",
            error,
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
      const existingVote = postVotes.find((v) => v.postId === post.id);

      const { voteChange, newVote, voteIdToDelete } = await voteAction(
        post,
        vote,
        communityId,
        existingVote,
      );

      const updatedPost = { ...post, voteStatus: post.voteStatus + voteChange };

      setPosts((prev) =>
        prev.map((item) => (item.id === post.id ? updatedPost : item)),
      );

      setPostVotes((prev) => {
        let updated = [...prev];
        if (voteIdToDelete) {
          updated = updated.filter((v) => v.id !== voteIdToDelete);
        } else if (newVote) {
          if (existingVote) {
            const idx = updated.findIndex((v) => v.id === existingVote.id);
            if (idx >= 0) updated[idx] = newVote;
          } else {
            updated = [...updated, newVote];
          }
        }
        return updated;
      });

      setUi((prev) =>
        prev.selectedPost?.id === post.id
          ? { ...prev, selectedPost: updatedPost }
          : prev,
      );

      void queryClient.invalidateQueries({ queryKey: keys.posts.detail(post.id!) });
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
      const fetched = await getPostVotesAction(postIds);
      setPostVotes(fetched as PostVote[]);
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
        setUi((prev) => ({ ...prev, selectedPost: post }));
        return post;
      }
      return null;
    } catch (error) {
      console.log("Error: getPost", error);
      return null;
    }
  };

  // posts/setPosts are part of the API; reference them so eslint won't strip when refactored
  void posts;

  return { onVote, getPostVotes, getPost };
};

export default usePostVote;
