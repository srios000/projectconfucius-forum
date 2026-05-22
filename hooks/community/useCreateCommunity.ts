import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { useCreateCommunityMutation } from "@/lib/queries/community/use-create-community-mutation";

/**
 * Shell over useCreateCommunityMutation. Preserves the public `createCommunity`
 * / `loading` / `error` / `setError` surface used by CreateCommunityModal.
 */
/**
 * A custom hook that provides functionality for creating a new community.
 * It includes client-side validation for the community name and delegates
 * creation to a server action.
 * @returns An object containing the `createCommunity` function, loading state, and error state.
 */
export const useCreateCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [error, setError] = useState("");
  const router = useRouter();
  const showToast = useCustomToast();
  const mutation = useCreateCommunityMutation();
  const loading = mutation.isPending;

  const onCreateCommunity = async (communityName: string, communityType: string) => {
    if (error) setError("");
    const format: RegExp = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (format.test(communityName)) {
      setError("Community name can only contain letters and numbers");
      return false;
    }
    if (communityName.length < 3) {
      setError("Community name must be at least 3 characters long");
      return false;
    }

    if (!user) {
      window.location.assign("/api/auth/start");
      return false;
    }

    try {
      await mutation.mutateAsync({ communityName, communityType });
      router.push(`/community/${communityName}`);
      return true;
    } catch (err: any) {
      console.log("Error: handleCreateCommunity", err);
      setError(err.message);
      showToast({
        title: "Community not Created",
        description: "There was an error creating your community",
        status: "error",
      });
      return false;
    }
  };

  return { createCommunity: onCreateCommunity, loading, error, setError };
};