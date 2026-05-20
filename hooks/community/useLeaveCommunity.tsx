import { useState } from "react";
import { uiAtom } from "@/atoms/uiAtom";
import { CommunitySnippet } from "@/types/community";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";
import { leaveCommunityAction } from "@/app/actions/community";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const useLeaveCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const userId = user?.id ?? "";
  const setUi = useSetAtom(uiAtom);
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLeaveCommunity = async (communityId: string) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    setLoading(true);
    try {
      await leaveCommunityAction(communityId);

      if (userId) {
        queryClient.setQueryData<CommunitySnippet[]>(
          keys.community.snippets(userId),
          (old = []) => old.filter((item) => item.communityId !== communityId),
        );
      }

      setUi((prev) =>
        prev.currentCommunity?.id === communityId
          ? {
              ...prev,
              currentCommunity: {
                ...prev.currentCommunity,
                numberOfMembers: prev.currentCommunity.numberOfMembers - 1,
              },
            }
          : prev,
      );

      void queryClient.invalidateQueries({
        queryKey: keys.community.detail(communityId),
      });
    } catch (error: any) {
      console.log("Error: leaveCommunity", error.message);
      setError(error.message);
      showToast({
        title: "Could not Unsubscribe",
        description: "There was an error unsubscribing from the community",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    leaveCommunity: onLeaveCommunity,
    leaveLoading: loading,
    leaveError: error,
  };
};

export default useLeaveCommunity;
