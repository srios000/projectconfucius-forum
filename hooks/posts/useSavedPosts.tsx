"use client";

import { useSession } from "@/lib/auth-client";
import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import useCustomToast from "../useCustomToast";
import { useSavedPostsQuery } from "@/lib/queries/posts/use-saved-posts";
import {
  useSavePostMutation,
  useUnsavePostMutation,
} from "@/lib/queries/posts/use-saved-posts-mutation";

/**
 * A custom hook that manages the user's saved posts.
 * It provides functionality for fetching saved posts, toggling the saved status of a post,
 * and removing posts from the saved collection.
 * @returns An object containing the saved posts state, loading state, and associated handlers.
 */
const useSavedPosts = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const savedQuery = useSavedPostsQuery();
  const savedPosts: SavedPost[] = (savedQuery.data ?? []) as SavedPost[];
  const showToast = useCustomToast();
  const saveMutation = useSavePostMutation();
  const unsaveMutation = useUnsavePostMutation();

  const fetchSavedPosts = async () => {
    await savedQuery.refetch();
  };

  const onSavePost = async (post: Post) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    const isSaved = savedPosts.find((item) => item.postId === post.id);
    try {
      if (isSaved) {
        await unsaveMutation.mutateAsync({ postId: post.id! });
        showToast({ title: "Post removed from saved", status: "success" });
      } else {
        await saveMutation.mutateAsync(post);
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
      await unsaveMutation.mutateAsync({ postId });
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
    !!savedPosts.find((item) => item.postId === postId);

  return {
    savedPosts,
    onSavePost,
    onRemoveSavedPost,
    isPostSaved,
    fetchSavedPosts,
    loading: savedQuery.isLoading,
  };
};

export default useSavedPosts;