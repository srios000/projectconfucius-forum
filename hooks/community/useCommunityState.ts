import { communityStateAtom } from "@/atoms/communitiesAtom";
import { useAtom } from "jotai";

const useCommunityState = () => {
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);

  return {
    communityStateValue,
    setCommunityStateValue,
  };
};

export default useCommunityState;
