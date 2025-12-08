"use client";

import { useCallback, useState } from "react";
import { fetchCommunityMembers } from "@/lib/community/fetchCommunityMembers";
import { CommunityMember } from "@/types/communityMember";

/**
 * Fetches and caches the members of a community for modal displays.
 * @param communityId - Target community to query.
 * @returns Member list, loading and error flags, plus a loader function.
 */
const useCommunityMembers = () => {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (communityId: string) => {
    setLoading(true);
    try {
      const result = await fetchCommunityMembers(communityId);
      setMembers(result);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load community members", err);
      setMembers([]);
      setError(err?.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    members,
    loading,
    error,
    loadMembers,
  };
};

export default useCommunityMembers;
