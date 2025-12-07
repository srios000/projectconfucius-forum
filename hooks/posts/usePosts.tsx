/* eslint-disable react-hooks/exhaustive-deps */
import usePostState from "./usePostState";
import usePostSelection from "./usePostSelection";
import usePostVote from "./usePostVote";
import usePostDeletion from "./usePostDeletion";
import usePostVoteSync from "./usePostVoteSync";

const usePosts = () => {
  const { postStateValue, setPostStateValue } = usePostState();
  const { onSelectPost } = usePostSelection(setPostStateValue);
  const { onVote, getPostVotes, getPost } = usePostVote(
    postStateValue,
    setPostStateValue
  );
  const { onDeletePost } = usePostDeletion(setPostStateValue);
  usePostVoteSync(setPostStateValue);

  return {
    postStateValue,
    setPostStateValue,
    onSelectPost,
    onVote,
    onDeletePost,
    getPostVotes,
    getPost,
  };
};

export default usePosts;
