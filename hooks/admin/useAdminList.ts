import { useCallback, useState } from "react";
import { AdminUser } from "@/types/adminUser";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";

/**
 * A custom hook that manages the retrieval and storage of a community's moderator list.
 * @returns An object containing the admin list, a setter for the list, a loading flag, and the fetch function.
 */
const useAdminList = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAdmins = useCallback(async (communityId: string) => {
    setLoading(true);
    try {
      const result = await fetchCommunityAdminsAction(communityId);
      setAdmins(
        result.map((m) => ({
          uid: m.id,
          email: m.email,
          displayName: m.displayName ?? undefined,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching admins", error);
      setAdmins([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { admins, setAdmins, loading, loadAdmins };
};

export default useAdminList;
