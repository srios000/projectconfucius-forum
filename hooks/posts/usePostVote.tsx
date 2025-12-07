/* eslint-disable react-hooks/exhaustive-deps */
import { authModalStateAtom } from "@/atoms/authModalAtom";
import { Post, PostVote } from "@/atoms/postsAtom";
import { auth, firestore } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDocs } from "firebase/firestore";
import { useSetAtom } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";
import React from "react";

type SetPostState = React.Dispatch<
  React.SetStateAction<{
    selectedPost: Post | null;
    posts: Post[];
    postVotes: PostVote[];
  }>
>;

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

      const batch = writeBatch(firestore);
      const updatedPost = { ...post };
      const updatedPosts = [...postStateValue.posts];
      let updatedPostVotes = [...postStateValue.postVotes];
      let voteChange = vote;

      if (!existingVote) {
        const postVoteRef = doc(
          collection(firestore, "users", `${user?.uid}/postVotes`)
        );
        const newVote: PostVote = {
          id: postVoteRef.id,
          postId: post.id!,
          communityId,
          voteValue: vote,
        };

        batch.set(postVoteRef, newVote);
        updatedPost.voteStatus = voteStatus + vote;
        updatedPostVotes = [...updatedPostVotes, newVote];
      } else {
        const postVoteRef = doc(
          firestore,
          "users",
          `${user?.uid}/postVotes/${existingVote.id}`
        );

        if (existingVote.voteValue === vote) {
          updatedPost.voteStatus = voteStatus - vote;
          updatedPostVotes = updatedPostVotes.filter(
            (v) => v.id !== existingVote.id
          );
          batch.delete(postVoteRef);
          voteChange *= -1;
        } else {
          updatedPost.voteStatus = voteStatus + 2 * vote;
          const voteIndexPosition = postStateValue.postVotes.findIndex(
            (v) => v.id === existingVote.id
          );

          updatedPostVotes[voteIndexPosition] = {
            ...existingVote,
            voteValue: vote,
          };

          batch.update(postVoteRef, {
            voteValue: vote,
          });
          voteChange = 2 * vote;
        }
      }

      const postRef = doc(firestore, "posts", post.id!);
      batch.update(postRef, { voteStatus: voteStatus + voteChange });
      await batch.commit();

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
      const chunks = [];
      const chunkSize = 10;
      for (let i = 0; i < postIds.length; i += chunkSize) {
        chunks.push(postIds.slice(i, i + chunkSize));
      }

      const promises = chunks.map((chunk) => {
        const postVotesQuery = query(
          collection(firestore, `users/${user.uid}/postVotes`),
          where("postId", "in", chunk)
        );
        return getDocs(postVotesQuery);
      });

      const querySnapshots = await Promise.all(promises);

      const postVotes = querySnapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );

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
      const postDocRef = doc(firestore, "posts", postId);
      const postDoc = await getDoc(postDocRef);
      if (postDoc.exists()) {
        const post = { id: postDoc.id, ...(postDoc.data() as Post) };
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
