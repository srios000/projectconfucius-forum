import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useAtom } from "jotai";

/**
 * Convenience hook for reading and mutating the global community atom.
 * @returns Current community state and setter.
 */
const useCommunityState = () => {
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);

  return {
    communityStateValue,
    setCommunityStateValue,
  };
};

export default useCommunityState;
