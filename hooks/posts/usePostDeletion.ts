import { Post } from "@/types/post";
import { SavedPost } from "@/types/savedPost";
import React from "react";
import { deletePostAction } from "@/app/actions/posts";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { useSession } from "@/lib/auth-client";

type UsePostDeletionOpts = {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
};

const usePostDeletion = ({ posts, setPosts }: UsePostDeletionOpts) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const onDeletePost = async (post: Post): Promise<boolean> => {
    const snapshot = posts;
    setPosts((prev) => prev.filter((item) => item.id !== post.id));

    if (userId) {
      queryClient.setQueryData<SavedPost[]>(
        keys.posts.saved(userId),
        (old = []) => old.filter((item) => item.postId !== post.id),
      );
    }

    try {
      await deletePostAction(post.id!);
      void queryClient.invalidateQueries({ queryKey: keys.posts.detail(post.id!) });
      return true;
    } catch (error) {
      console.log("Error deleting post", error);
      setPosts(snapshot);
      return false;
    }
  };

  return { onDeletePost };
};

export default usePostDeletion;
