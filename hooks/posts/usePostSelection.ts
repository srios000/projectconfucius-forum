import { Post } from "@/types/post";
import { keys } from "@/lib/queries/keys";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const usePostSelection = () => {
  const qc = useQueryClient();
  const router = useRouter();

  const onSelectPost = (post: Post) => {
    qc.setQueryData(keys.posts.detail(post.id!), post);
    router.push(`/community/${post.communityId}/comments/${post.id}`);
  };

  return { onSelectPost };
};

export default usePostSelection;