import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { createCommunityAction } from "@/app/actions/community";

/**
 * A custom hook that provides functionality for creating a new community.
 * It includes client-side validation for the community name and delegates
 * creation to a server action.
 * @returns An object containing the `createCommunity` function, loading state, and error state.
 */
export const useCreateCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const showToast = useCustomToast();

  const onCreateCommunity = async (
    communityName: string,
    communityType: string
  ) => {
    if (error) setError("");
    // prevents community from being created if it has special characters
    const format: RegExp = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (format.test(communityName)) {
      setError("Community name can only contain letters and numbers");
      return false;
    }
    // prevents community from being created if its too short
    if (communityName.length < 3) {
      setError("Community name must be at least 3 characters long");
      return false;
    }

    if (!user) {
      window.location.assign("/api/auth/start");
      return false;
    }

    setLoading(true);

    try {
      await createCommunityAction(communityName, communityType);

      router.push(`/community/${communityName}`);
      return true;
    } catch (error: any) {
      console.log("Error: handleCreateCommunity", error);
      setError(error.message);
      showToast({
        title: "Community not Created",
        description: "There was an error creating your community",
        status: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createCommunity: onCreateCommunity, loading, error, setError };
};
