import { uiAtom } from "@/atoms/uiAtom";
import { Post } from "@/types/post";
import { useAtom } from "jotai";

const usePostState = () => {
  const [ui, setUi] = useAtom(uiAtom);

  const selectedPost: Post | null = ui.selectedPost;
  const setSelectedPost = (post: Post | null) =>
    setUi((prev) => ({ ...prev, selectedPost: post }));

  return { selectedPost, setSelectedPost };
};

export default usePostState;
