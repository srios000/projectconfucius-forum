import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { useLeaveCommunityMutation } from "@/lib/queries/community/use-leave-community-mutation";

const useLeaveCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const [error, setError] = useState("");
  const mutation = useLeaveCommunityMutation();

  const onLeaveCommunity = async (communityId: string) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      await mutation.mutateAsync({ communityId });
    } catch (err: any) {
      console.log("Error: leaveCommunity", err.message);
      setError(err.message);
      showToast({
        title: "Could not Unsubscribe",
        description: "There was an error unsubscribing from the community",
        status: "error",
      });
    }
  };

  return {
    leaveCommunity: onLeaveCommunity,
    leaveLoading: mutation.isPending,
    leaveError: error,
  };
};

export default useLeaveCommunity;