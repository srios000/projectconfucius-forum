import { uiAtom } from "@/atoms/uiAtom";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import React from "react";
import { Post, PostVote } from "@/types/post";
import { getPostVotesAction } from "@/app/actions/posts";
import { getPostAction, getCommunityDataAction } from "@/app/actions/reads";
import useCommunityState from "../community/useCommunityState";
import { useSetAtom } from "jotai";
import { usePostVoteMutation } from "@/lib/queries/posts/use-post-vote";

type UsePostVoteOpts = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  postVotes: PostVote[];
  setPostVotes: (
    updater: PostVote[] | ((prev: PostVote[]) => PostVote[]),
  ) => void;
};

/**
 * A custom hook that manages the voting logic for posts.
 * It handles permission checks for restricted communities, processes upvotes and downvotes,
 * and synchronizes the local post state with the backend voting results.
 * @param postStateValue - The current state of posts and their associated votes.
 * @param setPostStateValue - A state setter function to update the global post state.
 * @returns An object containing functions for voting, loading votes, and fetching post data.
 */
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
  const voteMutation = usePostVoteMutation();
  const [pendingPostIds, setPendingPostIds] = React.useState<Set<string>>(
    () => new Set(),
  );

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

    if (pendingPostIds.has(post.id!)) return;

    const existingVote = postVotes.find((v) => v.postId === post.id);

    let optimisticChange: number;
    let optimisticNewVote: PostVote | undefined;
    let optimisticIdToDelete: string | undefined;
    if (!existingVote) {
      optimisticChange = vote;
      optimisticNewVote = {
        id: `optimistic-${post.id}-${Date.now()}`,
        postId: post.id!,
        communityId,
        voteValue: vote,
      };
    } else if (existingVote.voteValue === vote) {
      optimisticChange = -vote;
      optimisticIdToDelete = existingVote.id;
    } else {
      optimisticChange = 2 * vote;
      optimisticNewVote = { ...existingVote, voteValue: vote };
    }

    const postSnapshot = post;
    const voteSnapshot = existingVote ? { ...existingVote } : undefined;
    const updatedPost = {
      ...post,
      voteStatus: post.voteStatus + optimisticChange,
    };

    setPosts((prev) =>
      prev.map((item) => (item.id === post.id ? updatedPost : item)),
    );
    setPostVotes((prev) => {
      let next = [...prev];
      if (optimisticIdToDelete) {
        next = next.filter((v) => v.id !== optimisticIdToDelete);
      } else if (optimisticNewVote) {
        if (existingVote) {
          const idx = next.findIndex((v) => v.id === existingVote.id);
          if (idx >= 0) next[idx] = optimisticNewVote;
          else next.push(optimisticNewVote);
        } else {
          next.push(optimisticNewVote);
        }
      }
      return next;
    });
    setUi((prev) =>
      prev.selectedPost?.id === post.id
        ? { ...prev, selectedPost: updatedPost }
        : prev,
    );
    setPendingPostIds((prev) => {
      const next = new Set(prev);
      next.add(post.id!);
      return next;
    });

    try {
      const { newVote } = await voteMutation.mutateAsync({
        post,
        vote,
        communityId,
        existing: existingVote,
      });

      // Reconcile temp ID with server-assigned ID for newly created votes.
      if (newVote && optimisticNewVote && newVote.id !== optimisticNewVote.id) {
        setPostVotes((prev) =>
          prev.map((v) => (v.id === optimisticNewVote!.id ? newVote : v)),
        );
      }
    } catch (error) {
      console.log("Error: onVote", error);
      setPosts((prev) =>
        prev.map((item) => (item.id === post.id ? postSnapshot : item)),
      );
      setPostVotes((prev) => {
        let next = [...prev];
        if (optimisticIdToDelete && voteSnapshot) {
          next.push(voteSnapshot);
        } else if (optimisticNewVote) {
          if (voteSnapshot) {
            const idx = next.findIndex((v) => v.id === optimisticNewVote!.id);
            if (idx >= 0) next[idx] = voteSnapshot;
          } else {
            next = next.filter((v) => v.id !== optimisticNewVote!.id);
          }
        }
        return next;
      });
      setUi((prev) =>
        prev.selectedPost?.id === post.id
          ? { ...prev, selectedPost: postSnapshot }
          : prev,
      );
      showToast({
        title: "Could not Vote",
        description: "There was an error voting on the post",
        status: "error",
      });
    } finally {
      setPendingPostIds((prev) => {
        if (!prev.has(post.id!)) return prev;
        const next = new Set(prev);
        next.delete(post.id!);
        return next;
      });
    }
  };

  const isVotePending = (postId: string) => pendingPostIds.has(postId);

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

  void posts;

  return { onVote, getPostVotes, getPost, isVotePending };
};

export default usePostVote;