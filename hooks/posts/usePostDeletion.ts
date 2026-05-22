import { Post } from "@/types/post";
import { useDeletePostMutation } from "@/lib/queries/posts/use-delete-post";

const usePostDeletion = () => {
  const deleteMutation = useDeletePostMutation();
  const onDeletePost = async (post: Post): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync({ postId: post.id! });
      return true;
    } catch (error) {
      console.log("Error deleting post", error);
      return false;
    }
  };
  return { onDeletePost };
};

export default usePostDeletion;