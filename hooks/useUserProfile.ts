import { useSession } from "@/lib/auth-client";
import { profileNameAction, removeProfileImageAction } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useCustomToast from "./useCustomToast";
import { uploadImage } from "@/lib/upload/uploadImage";

/**
 * A custom hook that provides functionality for managing the authenticated user's profile.
 * Name changes propagate to the user's posts/comments via a server action.
 *
 * Phase A: profile image upload is deferred to Phase B — `updateImage` is a
 * no-op that surfaces a toast; `removeImage` clears the stored image. The
 * functions are kept exported so callers compile unchanged.
 * @returns An object containing functions for profile updates and associated loading states.
 */
const useUserProfile = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);

  const updateImage = async (blob: Blob) => {
    if (!user) return false;
    try {
      setLoading(true);
      await uploadImage("profile-image", blob);
      router.refresh();
      showToast({
        title: "Profile updated",
        description: "Your profile image has been updated",
        status: "success",
      });
      return true;
    } catch (err) {
      console.error("Error: updateImage:", err);
      showToast({
        title: "Image not Updated",
        description: err instanceof Error ? err.message : "Failed to upload image",
        status: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async () => {
    if (!user) return false;
    try {
      await removeProfileImageAction();
      router.refresh();
      showToast({
        title: "Profile updated",
        description: "Your profile image has been removed",
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
    if (!user) return false;
    try {
      setLoading(true);
      await profileNameAction(userName);
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
    } finally {
      setLoading(false);
    }
  };

  return {
    updateImage,
    removeImage,
    updateName,
    loading,
  };
};

export default useUserProfile;
