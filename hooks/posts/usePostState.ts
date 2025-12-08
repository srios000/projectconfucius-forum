import { postStateAtom } from "@/atoms/postsAtom";
import { useAtom } from "jotai";

/**
 * Convenience hook for accessing and updating the global post atom.
 * @returns Current post state and setter for mutations.
 */
const usePostState = () => {
  const [postStateValue, setPostStateValue] = useAtom(postStateAtom);

  return { postStateValue, setPostStateValue };
};

export default usePostState;
