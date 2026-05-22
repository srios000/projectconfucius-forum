import { useRouter } from "next/navigation";
import { Community } from "@/types/community";
import useCustomToast from "../useCustomToast";
import { useDeleteCommunityMutation } from "@/lib/queries/community/use-delete-community-mutation";

/**
 * Shell over useDeleteCommunityMutation. Preserves `{ deleteCommunity, loading }`.
 */
/**
 * A custom hook that provides functionality for deleting a community and all its associated data.
 * It handles the cascading deletion process and provides feedback via toasts and navigation.
 * @param communityData - The community object to be deleted.
 * @returns An object containing the `deleteCommunity` function and a loading state indicator.
 */
const useDeleteCommunity = (communityData: Community) => {
  const router = useRouter();
  const showToast = useCustomToast();
  const mutation = useDeleteCommunityMutation();

  const onDeleteCommunity = async () => {
    try {
      await mutation.mutateAsync({ communityData });
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
    }
  };

  return { deleteCommunity: onDeleteCommunity, loading: mutation.isPending };
};

export default useDeleteCommunity;