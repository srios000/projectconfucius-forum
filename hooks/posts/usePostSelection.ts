import { Post, PostVote } from "@/types/post";
import { useRouter } from "next/navigation";

const usePostSelection = (
  setPostStateValue: React.Dispatch<
    React.SetStateAction<{
      selectedPost: Post | null;
      posts: Post[];
      postVotes: PostVote[];
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
