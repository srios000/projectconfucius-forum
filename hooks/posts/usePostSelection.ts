import { Post, PostVote } from "@/types/post";
import { useRouter } from "next/navigation";

/**
 * Tracks the currently selected post and navigates to its comment page.
 * @param setPostStateValue - Setter for updating the selected post in global state.
 * @returns Handler to select a post and push the comment route.
 */
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
