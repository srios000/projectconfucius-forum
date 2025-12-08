import { authModalStateAtom } from "@/atoms/authModalAtom";
import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import { auth, firestore } from "@/firebase/clientApp";
import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";

/**
 * Manages a user's saved posts collection and related UI state.
 * @param post - Post to save or unsave.
 * @param postId - Identifier of the saved post entry to remove or check.
 * @returns Saved post state, loading flag, and handlers to fetch, toggle, or check saves.
 */
const useSavedPosts = () => {
  const [user] = useAuthState(auth);
  const [savedPostState, setSavedPostState] = useAtom(savedPostStateAtom);
  const setAuthModalState = useSetAtom(authModalStateAtom);
  const [loading, setLoading] = useState(false);
  const showToast = useCustomToast();

  const fetchSavedPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const querySnapshot = await getDocs(
        collection(firestore, `users/${user.uid}/savedPosts`)
      );
      const savedPosts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SavedPost[];

      setSavedPostState((prev) => ({
        ...prev,
        savedPosts,
      }));
    } catch (error: any) {
      console.log("fetchSavedPosts error", error);
      showToast({
        title: "Error fetching saved posts",
        description: error.message,
        status: "error",
      });
    }
    setLoading(false);
  };

  const onSavePost = async (post: Post) => {
    if (!user) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    try {
      const savedPostRef = doc(
        firestore,
        `users/${user.uid}/savedPosts`,
        post.id!
      );

      const isSaved = savedPostState.savedPosts.find(
        (item) => item.postId === post.id
      );

      if (isSaved) {
        await deleteDoc(savedPostRef);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: prev.savedPosts.filter((item) => item.postId !== post.id),
        }));
        showToast({
          title: "Post removed from saved",
          status: "success",
        });
      } else {
        const newSavedPost: SavedPost = {
          id: post.id!,
          postId: post.id!,
          communityId: post.communityId,
          postTitle: post.title,
          communityImageURL: post.communityImageURL || "",
        };
        await setDoc(savedPostRef, newSavedPost);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: [...prev.savedPosts, newSavedPost],
        }));
        showToast({
          title: "Post saved",
          status: "success",
        });
      }
    } catch (error: any) {
      console.log("onSavePost error", error);
      showToast({
        title: "Error saving post",
        description: error.message,
        status: "error",
      });
    }
  };

  const onRemoveSavedPost = async (postId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(firestore, `users/${user.uid}/savedPosts`, postId));
      setSavedPostState((prev) => ({
        ...prev,
        savedPosts: prev.savedPosts.filter((item) => item.postId !== postId),
      }));
      showToast({
        title: "Post removed from saved",
        status: "success",
      });
    } catch (error: any) {
      console.log("onRemoveSavedPost error", error);
      showToast({
        title: "Error removing saved post",
        description: error.message,
        status: "error",
      });
    }
  };

  const isPostSaved = (postId: string) => {
    return !!savedPostState.savedPosts.find((item) => item.postId === postId);
  };

  return {
    savedPostState,
    setSavedPostState,
    onSavePost,
    onRemoveSavedPost,
    isPostSaved,
    fetchSavedPosts,
    loading,
  };
};

export default useSavedPosts;
