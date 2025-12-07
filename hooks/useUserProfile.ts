import { postStateAtom } from "@/atoms/postsAtom";
import { auth } from "@/firebase/clientApp";
import {
  deleteProfileImage,
  updateUserCommentsName,
  updateUserPostsName,
  uploadProfileImage,
} from "@/lib/userProfile";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthState, useUpdateProfile } from "react-firebase-hooks/auth";
import useCustomToast from "./useCustomToast";

const useUserProfile = () => {
  const [user] = useAuthState(auth);
  const [updateProfile, updating, error] = useUpdateProfile(auth);
  const setPostStateValue = useSetAtom(postStateAtom);
  const router = useRouter();
  const showToast = useCustomToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const updateImage = async (selectedFile: string) => {
    if (!user || !selectedFile) return;

    try {
      setUploadingImage(true);
      const downloadURL = await uploadProfileImage(user.uid, selectedFile);

      const success = await updateProfile({
        photoURL: downloadURL,
      });

      if (!success) {
        throw new Error("Failed to update profile image");
      }

      await user.reload();
      router.refresh();

      showToast({
        title: "Profile updated",
        description: "Your profile has been updated",
        status: "success",
      });
      return true;
    } catch (error) {
      console.error("Error: updateImage: ", error);
      showToast({
        title: "Image not Updated",
        description: "Failed to update profile image",
        status: "error",
      });
      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (!user) return;

    try {
      await deleteProfileImage(user.uid);
      const success = await updateProfile({
        photoURL: "",
      });

      if (!success) {
        throw new Error("Failed to delete profile image");
      }

      await user.reload();
      router.refresh();

      showToast({
        title: "Profile updated",
        description: "Your profile has been updated",
        status: "success",
      });
      return true;
    } catch (error) {
      console.error("Error: removeImage: ", error);
      showToast({
        title: "Image not Deleted",
        description: "Failed to delete profile image",
        status: "error",
      });
      return false;
    }
  };

  const updateName = async (userName: string) => {
    if (!user) return;

    try {
      const success = await updateProfile({
        displayName: userName,
      });

      if (!success) {
        throw new Error("Failed to update profile name");
      }

      await updateUserCommentsName(user.uid, userName);
      await updateUserPostsName(user.uid, userName);

      setPostStateValue((prev) => ({
        ...prev,
        posts: prev.posts.map((post) => {
          if (post.creatorId === user.uid) {
            return { ...post, creatorUsername: userName };
          }
          return post;
        }),
      }));

      await user.reload();
      router.refresh();
      return true;
    } catch (error) {
      console.error("Error: updateName: ", error);
      showToast({
        title: "Name not Updated",
        description: "Failed to update profile name",
        status: "error",
      });
      return false;
    }
  };

  return {
    updateImage,
    removeImage,
    updateName,
    loading: updating || uploadingImage,
  };
};

export default useUserProfile;
