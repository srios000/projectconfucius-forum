import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import useDirectory from "../useDirectory";

/**
 * A custom hook that handles the logic for initiating the post creation process.
 * It checks for user authentication and either navigates to the community's submit page
 * or opens the directory menu to allow the user to select a community.
 * @returns An object containing the `onClick` handler for the "Create Post" action.
 */
const useCallCreatePost = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { toggleMenuOpen } = useDirectory();

  const onClick = () => {
    if (!user) {
      window.location.assign("/api/auth/start");
      return;
    }
    const communityId = params?.communityId;

    if (communityId) {
      router.push(`/community/${communityId}/submit`);
      return;
    } else {
      toggleMenuOpen();
    }
  };

  return {
    onClick,
  };
};
export default useCallCreatePost;
