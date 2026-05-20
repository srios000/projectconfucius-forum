import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSetAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { Community } from "@/types/community";
import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityImageAction } from "@/app/actions/community";

/**
 * A custom hook that provides functionality for managing a community's profile image.
 * It handles uploading new images, deleting existing ones, and synchronizing these changes
 * across the community document and all user membership snippets.
 * @param communityData - The community object whose image is being managed.
 * @returns An object containing functions for updating and deleting the image, and an uploading state indicator.
 */
const useCommunityImage = (communityData: Community) => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const onUpdateImage = async (blob: Blob) => {
    if (!blob) return;
    setUploadingImage(true);

    try {
      const { imageUrl } = await uploadImage("community-image", blob, communityData.id);

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: { ...prev.currentCommunity, imageUrl } as Community,
      }));
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.map((snippet) =>
          snippet.communityId === communityData.id ? { ...snippet, imageUrl } : snippet,
        ),
      }));
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

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          imageUrl: "",
        } as Community,
      }));

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.map((snippet) => {
          if (snippet.communityId === communityData.id) {
            return {
              ...snippet,
              imageUrl: "",
            };
          }
          return snippet;
        }),
      }));
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
