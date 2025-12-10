import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import useCustomToast from "@/hooks/useCustomToast";
import { createPost } from "@/lib/posts/createPost";

/**
 * Creates a new post, uploads an optional image, and notifies the user.
 * @param user - Authenticated user creating the post.
 * @param communityId - Community where the post belongs.
 * @param communityImageURL - Optional community icon to store with the post.
 * @param postData - Title and body content for the post.
 * @param selectedFile - Optional base64 image to upload.
 * @returns Handler to submit a post plus loading and error flags.
 */
const useCreatePost = () => {
  const router = useRouter();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleCreatePost = async (
    user: User,
    communityId: string,
    communityImageURL: string | undefined,
    postData: { title: string; body: string },
    selectedFile?: string
  ) => {
    if (!user) return;
    setLoading(true);
    try {
      await createPost(
        user,
        communityId,
        communityImageURL,
        postData,
        selectedFile
      );

      router.back();
      showToast({
        title: "Post Created",
        description: "Your post has been created successfully",
        status: "success",
      });
    } catch (error: any) {
      console.log("handleCreatePost error", error);
      setError(true);
      showToast({
        title: "Error Creating Post",
        description: "There was an error creating your post",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    handleCreatePost,
    loading,
    error,
  };
};

export default useCreatePost;
