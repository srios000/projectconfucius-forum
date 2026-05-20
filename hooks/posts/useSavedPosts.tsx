"use client";

import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import { useSession } from "@/lib/auth-client";
import { Post } from "@/types/post";
import { useAtom } from "jotai";
import { useEffect } from "react";
import useCustomToast from "../useCustomToast";
import {
  savePostAction,
  unsavePostAction,
} from "@/app/actions/posts";
import { useSavedPostsQuery } from "@/lib/queries/posts/use-saved-posts";

/**
 * A custom hook that manages the user's saved posts.
 * It provides functionality for fetching saved posts, toggling the saved status of a post,
 * and removing posts from the saved collection.
 * @returns An object containing the saved posts state, loading state, and associated handlers.
 */
const useSavedPosts = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [savedPostState, setSavedPostState] = useAtom(savedPostStateAtom);
  const showToast = useCustomToast();

  const savedQuery = useSavedPostsQuery();
  const loading = savedQuery.isLoading;

  useEffect(() => {
    if (!user) {
      setSavedPostState((prev) => ({ ...prev, savedPosts: [] }));
      return;
    }
    if (savedQuery.data) {
      setSavedPostState((prev) => ({ ...prev, savedPosts: savedQuery.data }));
    }
  }, [user, savedQuery.data, setSavedPostState]);

  const fetchSavedPosts = async () => {
    await savedQuery.refetch();
  };

  const onSavePost = async (post: Post) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      const isSaved = savedPostState.savedPosts.find(
        (item) => item.postId === post.id,
      );
      if (isSaved) {
        await unsavePostAction(post.id!);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: prev.savedPosts.filter((item) => item.postId !== post.id),
        }));
        showToast({ title: "Post removed from saved", status: "success" });
      } else {
        const newSavedPost = await savePostAction(post);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: [...prev.savedPosts, newSavedPost],
        }));
        showToast({ title: "Post saved", status: "success" });
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
      await unsavePostAction(postId);
      setSavedPostState((prev) => ({
        ...prev,
        savedPosts: prev.savedPosts.filter((item) => item.postId !== postId),
      }));
      showToast({ title: "Post removed from saved", status: "success" });
    } catch (error: any) {
      console.log("onRemoveSavedPost error", error);
      showToast({
        title: "Error removing saved post",
        description: error.message,
        status: "error",
      });
    }
  };

  const isPostSaved = (postId: string) =>
    !!savedPostState.savedPosts.find((item) => item.postId === postId);

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