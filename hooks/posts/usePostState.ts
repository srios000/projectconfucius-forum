import { postStateAtom } from "@/atoms/postsAtom";
import { useAtom } from "jotai";

const usePostState = () => {
  const [postStateValue, setPostStateValue] = useAtom(postStateAtom);

  return { postStateValue, setPostStateValue };
};

export default usePostState;
