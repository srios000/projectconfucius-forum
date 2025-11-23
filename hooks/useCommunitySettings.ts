import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";
import { useAtom } from "jotai";
import { useState } from "react";
import useCustomToast from "./useCustomToast";

export const useCommunitySettings = (communityData: Community) => {
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);
  const [uploadingImage, setUploadingImage] = useState(false);
  const showToast = useCustomToast();

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

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await updateDoc(doc(firestore, "communities", communityData.id), {
        privacyType,
      });
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          privacyType: privacyType,
        } as Community,
      }));
    } catch (error) {
      console.log("Error: onUpdateCommunityPrivacyType", error);
      showToast({
        title: "Privacy Type not Updated",
        description: "There was an error updating the community privacy type",
        status: "error",
      });
    }
  };

  return {
    updateImage,
    deleteCommunityImage,
    updatePrivacyType,
    uploadingImage,
  };
};
