import { useState } from "react";
import { Community } from "@/types/community";
import { useSession } from "@/lib/auth-client";
import useCustomToast from "../useCustomToast";
import { useJoinCommunityMutation } from "@/lib/queries/community/use-join-community-mutation";

const useJoinCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const showToast = useCustomToast();
  const [error, setError] = useState("");
  const mutation = useJoinCommunityMutation();

  const onJoinCommunity = async (communityData: Community) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    try {
      await mutation.mutateAsync({ communityData });
    } catch (err: any) {
      console.log("Error: joinCommunity", err);
      showToast({
        title: "Could not Subscribe",
        description: "There was an error subscribing to the community",
        status: "error",
      });
      setError(err.message);
    }
  };

  return {
    joinCommunity: onJoinCommunity,
    joinLoading: mutation.isPending,
    joinError: error,
  };
};

export default useJoinCommunity;