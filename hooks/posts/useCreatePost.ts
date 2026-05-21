import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "@/hooks/useCustomToast";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";
import { uploadImage } from "@/lib/upload/uploadImage";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { getCommunityDataAction } from "@/app/actions/reads";
import type { Community } from "@/types/community";

const useCreatePost = () => {
  const router = useRouter();
  const showToast = useCustomToast();
  const { data: session } = useSession();
  const [error, setError] = useState(false);
  const qc = useQueryClient();
  const snippets = useCommunitySnippetsQuery();
  const createMutation = useCreatePostMutation();
  const loading = createMutation.isPending;

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

    const cachedCommunity = qc.getQueryData<Community>(keys.community.detail(communityId));
    const currentCommunity = cachedCommunity ?? (await qc.fetchQuery({
      queryKey: keys.community.detail(communityId),
      queryFn: () => getCommunityDataAction(communityId),
    }));
    if (currentCommunity) {
      const hasPermission = checkCommunityPermission(
        currentCommunity as Community,
        snippets.data ?? [],
      );
      if (!hasPermission) {
        showToast({
          title: "Restricted Community",
          description: "You must be a member to post in this community.",
          status: "error",
        });
        return;
      }
    }

    try {
      let imageUrl: string | undefined;
      if (selectedBlob) {
        const result = await uploadImage("post-image", selectedBlob);
        imageUrl = result.imageUrl;
      }
      await createMutation.mutateAsync({
        communityId,
        communityImageUrl: communityImageURL,
        postData,
        imageUrl,
      });
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
        description:
          err instanceof Error ? err.message : "There was an error creating your post",
        status: "error",
      });
    }
  };

  return { handleCreatePost, loading, error };
};

export default useCreatePost;
