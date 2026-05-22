import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { Community } from "@/types/community";
import {
  useUploadCommunityImageMutation,
  useDeleteCommunityImageMutation,
} from "@/lib/queries/community/use-community-image-mutation";

const useCommunityImage = (communityData: Community) => {
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const uploadMutation = useUploadCommunityImageMutation();
  const deleteMutation = useDeleteCommunityImageMutation();

  const onUpdateImage = async (blob: Blob) => {
    if (!blob) return;
    setUploadingImage(true);
    try {
      await uploadMutation.mutateAsync({ communityId: communityData.id, blob });
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
      await deleteMutation.mutateAsync({ communityId: communityData.id });
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