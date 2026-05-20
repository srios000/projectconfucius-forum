"use client";

import { useSession } from "@/lib/auth-client";
import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import useCustomToast from "../useCustomToast";
import {
  savePostAction,
  unsavePostAction,
} from "@/app/actions/posts";
import { useSavedPostsQuery } from "@/lib/queries/posts/use-saved-posts";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const useSavedPosts = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const savedQuery = useSavedPostsQuery();
  const savedPosts: SavedPost[] = (savedQuery.data ?? []) as SavedPost[];
  const showToast = useCustomToast();

  const fetchSavedPosts = async () => {
    await savedQuery.refetch();
  };

  const onSavePost = async (post: Post) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      const isSaved = savedPosts.find((item) => item.postId === post.id);
      if (isSaved) {
        queryClient.setQueryData<SavedPost[]>(
          keys.posts.saved(userId),
          (old = []) => old.filter((item) => item.postId !== post.id),
        );
        await unsavePostAction(post.id!);
        showToast({ title: "Post removed from saved", status: "success" });
      } else {
        const newSavedPost = await savePostAction(post);
        queryClient.setQueryData<SavedPost[]>(
          keys.posts.saved(userId),
          (old = []) => [...old, newSavedPost as SavedPost],
        );
        showToast({ title: "Post saved", status: "success" });
      }
      await queryClient.invalidateQueries({ queryKey: keys.posts.saved(userId) });
    } catch (error: any) {
      console.log("onSavePost error", error);
      showToast({
        title: "Error saving post",
        description: error.message,
        status: "error",
      });
      await queryClient.invalidateQueries({ queryKey: keys.posts.saved(userId) });
    }
  };

  const onRemoveSavedPost = async (postId: string) => {
    if (!user) return;
    queryClient.setQueryData<SavedPost[]>(
      keys.posts.saved(userId),
      (old = []) => old.filter((item) => item.postId !== postId),
    );
    try {
      await unsavePostAction(postId);
      showToast({ title: "Post removed from saved", status: "success" });
    } catch (error: any) {
      console.log("onRemoveSavedPost error", error);
      showToast({
        title: "Error removing saved post",
        description: error.message,
        status: "error",
      });
    } finally {
      await queryClient.invalidateQueries({ queryKey: keys.posts.saved(userId) });
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
