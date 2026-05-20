import { uiAtom } from "@/atoms/uiAtom";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { Community, CommunitySnippet } from "@/types/community";
import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityImageAction } from "@/app/actions/community";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const useCommunityImage = (communityData: Community) => {
  const setUi = useSetAtom(uiAtom);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const applyImageUrl = (imageUrl: string) => {
    setUi((prev) =>
      prev.currentCommunity?.id === communityData.id
        ? { ...prev, currentCommunity: { ...prev.currentCommunity, imageUrl } as Community }
        : prev,
    );
    if (userId) {
      queryClient.setQueryData<CommunitySnippet[]>(
        keys.community.snippets(userId),
        (old = []) =>
          old.map((snippet) =>
            snippet.communityId === communityData.id ? { ...snippet, imageUrl } : snippet,
          ),
      );
    }
    void queryClient.invalidateQueries({
      queryKey: keys.community.detail(communityData.id),
    });
  };

  const onUpdateImage = async (blob: Blob) => {
    if (!blob) return;
    setUploadingImage(true);
    try {
      const { imageUrl } = await uploadImage(
        "community-image",
        blob,
        communityData.id,
      );
      applyImageUrl(imageUrl);
    } catch (err) {
      console.log("Error: onUploadImage", err);
      showToast({
        title: "Image not Updated",
        description: err instanceof Error ? err.message : "There was an error updating the image",
        status: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onDeleteCommunityImage = async () => {
    try {
      await deleteCommunityImageAction(communityData.id);
      applyImageUrl("");
    } catch (error) {
      console.log("Error: onDeleteCommunityImage", error);
      showToast({
        title: "Image not Deleted",
        description: "There was an error deleting the image",
        status: "error",
      });
    }
  };

  return {
    updateImage: onUpdateImage,
    deleteCommunityImage: onDeleteCommunityImage,
    uploadingImage,
  };
};

export default useCommunityImage;
