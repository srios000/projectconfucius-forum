import { useState } from "react";
import { uiAtom } from "@/atoms/uiAtom";
import { Community, CommunitySnippet } from "@/types/community";
import { useSession } from "@/lib/auth-client";
import { useSetAtom } from "jotai";
import useCustomToast from "../useCustomToast";
import { joinCommunityAction } from "@/app/actions/community";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";

const useJoinCommunity = () => {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const userId = user?.id ?? "";
  const setUi = useSetAtom(uiAtom);
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onJoinCommunity = async (communityData: Community) => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    setLoading(true);
    try {
      const newSnippet = await joinCommunityAction(communityData);

      if (userId) {
        queryClient.setQueryData<CommunitySnippet[]>(
          keys.community.snippets(userId),
          (old = []) => [...old, newSnippet],
        );
      }

      setUi((prev) =>
        prev.currentCommunity?.id === communityData.id
          ? {
              ...prev,
              currentCommunity: {
                ...prev.currentCommunity,
                numberOfMembers: prev.currentCommunity.numberOfMembers + 1,
              },
            }
          : prev,
      );

      void queryClient.invalidateQueries({
        queryKey: keys.community.detail(communityData.id),
      });
    } catch (error: any) {
      console.log("Error: joinCommunity", error);
      showToast({
        title: "Could not Subscribe",
        description: "There was an error subscribing to the community",
        status: "error",
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    joinCommunity: onJoinCommunity,
    joinLoading: loading,
    joinError: error,
  };
};

export default useJoinCommunity;
