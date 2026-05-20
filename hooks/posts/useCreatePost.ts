import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "@/hooks/useCustomToast";
import { createPostAction } from "@/app/actions/posts";
import useCommunityState from "../community/useCommunityState";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";
import { uploadImage } from "@/lib/upload/uploadImage";

/**
 * A custom hook that provides functionality for creating a new post.
 * It handles permission checks for restricted communities and provides feedback via toasts.
 *
 * Phase A: image upload is deferred to Phase B — `selectedFile` is accepted for
 * signature stability but not persisted (the create action stores no image yet).
 * @returns An object containing the `handleCreatePost` function, loading state, and error state.
 */
const useCreatePost = () => {
  const router = useRouter();
  const showToast = useCustomToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { communityStateValue } = useCommunityState();

  const handleCreatePost = async (
    communityId: string,
    communityImageURL: string | undefined,
    postData: { title: string; body: string },
    selectedBlob?: Blob,
  ) => {
    if (!session?.user) {
      window.location.assign("/api/auth/start");
      return;
    }
    setLoading(true);

    const currentCommunity = communityStateValue.currentCommunity;
    if (currentCommunity?.id === communityId) {
      const hasPermission = checkCommunityPermission(currentCommunity, communityStateValue.mySnippets);
      if (!hasPermission) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to post in this community.",
          status: "error",
        });
        setLoading(false);
        return;
      }
    }

    try {
      let imageUrl: string | undefined;
      if (selectedBlob) {
        const result = await uploadImage("post-image", selectedBlob);
        imageUrl = result.imageUrl;
      }
      await createPostAction(communityId, communityImageURL, postData, imageUrl);
      router.back();
      showToast({
        title: "Post Created",
        description: "Your post has been created successfully",
        status: "success",
      });
    } catch (err) {
      console.log("handleCreatePost error", err);
      setError(true);
      showToast({
        title: "Error Creating Post",
        description: err instanceof Error ? err.message : "There was an error creating your post",
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
