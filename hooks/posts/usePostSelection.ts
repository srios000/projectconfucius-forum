import { uiAtom } from "@/atoms/uiAtom";
import { Post } from "@/types/post";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";

const usePostSelection = () => {
  const setUi = useSetAtom(uiAtom);
  const router = useRouter();

  const onSelectPost = (post: Post) => {
    setUi((prev) => ({ ...prev, selectedPost: post }));
    router.push(`/community/${post.communityId}/comments/${post.id}`);
  };

  return { onSelectPost };
};

export default usePostSelection;
