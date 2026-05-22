import { authClient, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import useCustomToast from "./useCustomToast";
import {
  useUploadProfileImageMutation,
  useRemoveProfileImageMutation,
  useUpdateProfileNameMutation,
} from "@/lib/queries/profile/use-profile-mutations";

// Better-auth caches the session client-side. After we mutate the user (image,
// name), `router.refresh()` re-runs server components but the `useSession()`
// store stays stale, so the navbar avatar doesn't update until full reload.
// Calling getSession with cookie cache disabled forces a fresh fetch and the
// store notifies all `useSession()` consumers.
const refreshAuthSession = () => {
  void authClient.getSession({ query: { disableCookieCache: true } });
};

/**
 * Shell over the three profile mutations. Preserves the
 * `{ updateImage, removeImage, updateName, loading }` surface used by
 * ProfileModal. router.refresh() is retained because profile data is read
 * from server components today; the mutation invalidation hits
 * keys.profile(userId), which is forward-compatible plumbing for when a
 * useProfileQuery consumer lands.
 */
/**
 * A custom hook that provides functionality for managing the authenticated user's profile.
 * Name changes propagate to the user's posts/comments via a server action.
 * @returns An object containing functions for profile updates and associated loading states.
 */
const useUserProfile = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const router = useRouter();
  const showToast = useCustomToast();
  const uploadMutation = useUploadProfileImageMutation();
  const removeMutation = useRemoveProfileImageMutation();
  const nameMutation = useUpdateProfileNameMutation();

  const loading =
    uploadMutation.isPending || removeMutation.isPending || nameMutation.isPending;

  const updateImage = async (blob: Blob) => {
    if (!user) return false;
    try {
      await uploadMutation.mutateAsync({ blob });
      router.refresh();
      refreshAuthSession();
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
    }
  };

  const removeImage = async () => {
    if (!user) return false;
    try {
      await removeMutation.mutateAsync();
      router.refresh();
      refreshAuthSession();
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
      await nameMutation.mutateAsync({ name: userName });
      router.refresh();
      refreshAuthSession();
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

  return { updateImage, removeImage, updateName, loading };
};

export default useUserProfile;