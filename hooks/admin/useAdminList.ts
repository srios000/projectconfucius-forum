import { useCallback, useState } from "react";
import { AdminUser } from "@/types/adminUser";
import { fetchCommunityAdmins } from "@/lib/community/fetchCommunityAdmins";

const useAdminList = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAdmins = useCallback(
    async (creatorId: string, adminIds?: string[]) => {
      setLoading(true);
      try {
        const result = await fetchCommunityAdmins(creatorId, adminIds);
        setAdmins(result);
      } catch (error: any) {
        console.error("Error fetching admins", error);
        setAdmins([]);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { admins, setAdmins, loading, loadAdmins };
};

export default useAdminList;
