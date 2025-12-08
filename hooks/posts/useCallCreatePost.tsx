import { authModalStateAtom } from "@/atoms/authModalAtom";
import { auth } from "@/firebase/clientApp";
import { useSetAtom } from "jotai";
import { useRouter, useParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import useDirectory from "../useDirectory";

/**
 * Handles clicks on "Create Post" by gating on auth and routing to the right submit page.
 * @returns Click handler that opens auth modal, navigates, or toggles the directory menu.
 */
const useCallCreatePost = () => {
  const router = useRouter();
  const params = useParams();
  const [user] = useAuthState(auth);
  const setAuthModalState = useSetAtom(authModalStateAtom);
  const { toggleMenuOpen } = useDirectory();

  const onClick = () => {
    if (!user) {
      setAuthModalState({ open: true, view: "login" });
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
