import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import { useSession } from "@/lib/auth-client";
import { Post } from "@/types/post";
import { useAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "../useCustomToast";
import {
  getSavedPostsAction,
  savePostAction,
  unsavePostAction,
} from "@/app/actions/posts";

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
  const [loading, setLoading] = useState(false);
  const showToast = useCustomToast();

  const fetchSavedPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const savedPosts = await getSavedPostsAction();

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
      window.location.assign("/api/auth/start");
      return;
    }

    try {
      const isSaved = savedPostState.savedPosts.find(
        (item) => item.postId === post.id
      );

      if (isSaved) {
        await unsavePostAction(post.id!);
        setSavedPostState((prev) => ({
          ...prev,
          savedPosts: prev.savedPosts.filter((item) => item.postId !== post.id),
        }));
        showToast({
          title: "Post removed from saved",
          status: "success",
        });
      } else {
        const newSavedPost = await savePostAction(post);
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
      await unsavePostAction(postId);
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
