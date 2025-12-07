import { Post } from "@/atoms/postsAtom";
import { useRouter } from "next/navigation";

const usePostSelection = (
  setPostStateValue: React.Dispatch<
    React.SetStateAction<{
      selectedPost: Post | null;
      posts: Post[];
      postVotes: import("@/atoms/postsAtom").PostVote[];
    }>
  >
) => {
  const router = useRouter();

  const onSelectPost = (post: Post) => {
    setPostStateValue((prev) => ({
      ...prev,
      selectedPost: post,
    }));
    router.push(`/community/${post.communityId}/comments/${post.id}`);
  };

  return { onSelectPost };
};

export default usePostSelection;
