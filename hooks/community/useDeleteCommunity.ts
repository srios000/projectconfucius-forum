import { useState } from "react";
import { useRouter } from "next/navigation";
import { Community } from "@/types/community";
import useCustomToast from "../useCustomToast";
import { deleteCommunity } from "@/lib/community/deleteCommunity";

/**
 * Deletes a community and all related posts, comments, votes, and snippets.
 * @param communityData - Community to remove.
 * @returns Handler that performs the cascade delete and a loading flag.
 */
const useDeleteCommunity = (communityData: Community) => {
  const router = useRouter();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);

  const onDeleteCommunity = async () => {
    setLoading(true);
    try {
      await deleteCommunity(communityData);

      showToast({
        title: "Community Deleted",
        description: "Community has been deleted successfully",
        status: "success",
      });

      router.push("/");
    } catch (error) {
      console.log("Error: deleteCommunity", error);
      showToast({
        title: "Community not Deleted",
        description: "There was an error deleting the community",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return { deleteCommunity: onDeleteCommunity, loading };
};

export default useDeleteCommunity;
