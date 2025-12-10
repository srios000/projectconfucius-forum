import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useSetAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { Community } from "@/types/community";
import { updateCommunityImage } from "@/lib/community/updateCommunityImage";
import { deleteCommunityImage } from "@/lib/community/deleteCommunityImage";

/**
 * Uploads or removes a community image while syncing snippets and local state.
 * @param communityData - Community whose image is being managed.
 * @returns Handlers to update or delete the image along with an uploading flag.
 */
const useCommunityImage = (communityData: Community) => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const onUpdateImage = async (selectedFile: string) => {
    if (!selectedFile) return;
    setUploadingImage(true);

    try {
      const downloadURL = await updateCommunityImage(
        communityData.id,
        selectedFile
      );

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          imageURL: downloadURL,
        } as Community,
      }));

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.map((snippet) => {
          if (snippet.communityId === communityData.id) {
            return {
              ...snippet,
              imageURL: downloadURL,
            };
          }
          return snippet;
        }),
      }));
    } catch (error) {
      console.log("Error: onUploadImage", error);
      showToast({
        title: "Image not Updated",
        description: "There was an error updating the image",
        status: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onDeleteCommunityImage = async () => {
    try {
      await deleteCommunityImage(communityData.id);

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          imageURL: "",
        } as Community,
      }));

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.map((snippet) => {
          if (snippet.communityId === communityData.id) {
            return {
              ...snippet,
              imageURL: "",
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
