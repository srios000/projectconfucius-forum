import { communityStateAtom } from "@/atoms/communitiesAtom";
import { firestore, storage } from "@/firebase/clientApp";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadString } from "firebase/storage";
import { useSetAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "../useCustomToast";
import { Community } from "@/types/community";

/**
 * Uploads or removes a community image while syncing snippets and local state.
 * @param communityData - Community whose image is being managed.
 * @returns Handlers to update or delete the image along with an uploading flag.
 */
const useCommunityImage = (communityData: Community) => {
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const updateImage = async (selectedFile: string) => {
    if (!selectedFile) return;
    setUploadingImage(true);

    try {
      const imageRef = ref(storage, `communities/${communityData.id}/image`);
      await uploadString(imageRef, selectedFile, "data_url");
      const downloadURL = await getDownloadURL(imageRef);
      await updateDoc(doc(firestore, "communities", communityData.id), {
        imageURL: downloadURL,
      });

      const usersSnapshot = await getDocs(collection(firestore, "users"));
      usersSnapshot.forEach(async (userDoc) => {
        const communitySnippetDoc = await getDoc(
          doc(
            firestore,
            "users",
            userDoc.id,
            "communitySnippets",
            communityData.id
          )
        );
        if (communitySnippetDoc.exists()) {
          await updateDoc(
            doc(
              firestore,
              "users",
              userDoc.id,
              "communitySnippets",
              communityData.id
            ),
            {
              imageURL: downloadURL,
            }
          );
        }
      });

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

  const deleteCommunityImage = async () => {
    try {
      const imageRef = ref(storage, `communities/${communityData.id}/image`);
      await deleteObject(imageRef);
      await updateDoc(doc(firestore, "communities", communityData.id), {
        imageURL: "",
      });

      const usersSnapshot = await getDocs(collection(firestore, "users"));
      usersSnapshot.forEach(async (userDoc) => {
        const communitySnippetDoc = await getDoc(
          doc(
            firestore,
            "users",
            userDoc.id,
            "communitySnippets",
            communityData.id
          )
        );
        if (communitySnippetDoc.exists()) {
          await updateDoc(
            doc(
              firestore,
              "users",
              userDoc.id,
              "communitySnippets",
              communityData.id
            ),
            {
              imageURL: "",
            }
          );
        }
      });

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
      console.log("Error: onDeleteImage", error);
      showToast({
        title: "Image not Deleted",
        description: "There was an error deleting the image",
        status: "error",
      });
    }
  };

  return {
    updateImage,
    deleteCommunityImage,
    uploadingImage,
  };
};

export default useCommunityImage;
