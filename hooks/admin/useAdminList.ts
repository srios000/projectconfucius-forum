"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminUser } from "@/types/adminUser";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

/**
 * A custom hook that manages the retrieval and storage of a community's moderator list.
 * @returns An object containing the admin list, a setter for the list, a loading flag, and the fetch function.
 */
const useAdminList = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const loadAdmins = useCallback(
    async (communityId: string) => {
      setLoading(true);
      try {
        const result = await queryClient.fetchQuery({
          queryKey: keys.community.admins(communityId),
          queryFn: async () => {
            const r = await fetchCommunityAdminsAction(communityId);
            return r.map((m) => ({
              uid: m.id,
              email: m.email,
              displayName: m.displayName ?? undefined,
            }));
          },
        });
        setAdmins(result);
      } catch (error: any) {
        console.error("Error fetching admins", error);
        setAdmins([]);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [queryClient],
  );

  return { admins, setAdmins, loading, loadAdmins };
};

export default useAdminList;