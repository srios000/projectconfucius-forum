import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";
import { createCommunity } from "@/lib/community/createCommunity";

/**
 * Creates a new community with validation and a creator snippet transaction.
 * Validates slugs locally before hitting Firestore to avoid noisy toasts.
 * @returns Handler to run creation plus loading and error state.
 */
export const useCreateCommunity = () => {
  const [user] = useAuthState(auth);
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

    setLoading(true);

    try {
      await createCommunity(communityName, communityType, user?.uid!);

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
