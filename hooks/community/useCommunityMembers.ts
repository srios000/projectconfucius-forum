"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCommunityMembersAction } from "@/app/actions/reads";
import { CommunityMember } from "@/types/communityMember";
import { keys } from "@/lib/queries/keys";

const useCommunityMembers = () => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const loadMembers = useCallback(
    async (communityId: string) => {
      setLoading(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: keys.community.members(communityId),
          queryFn: () => fetchCommunityMembersAction(communityId),
        });
        setMembers(result);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load community members", err);
        setMembers([]);
        setError(err?.message || "Failed to load members");
      } finally {
        setLoading(false);
      }
    },
    [queryClient],
  );

  return {
    members,
    loading,
    error,
    loadMembers,
  };
};

export default useCommunityMembers;