import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { firestore } from "@/firebase/clientApp";
import { Post } from "@/atoms/postsAtom";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "../../types/comment";

const useCommentList = (selectedPost: Post | null) => {
  const showToast = useCustomToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFetchLoading, setCommentFetchLoading] = useState(true);

  const loadComments = useCallback(async () => {
    if (!selectedPost) return;
    setCommentFetchLoading(true);
    try {
      const commentsQuery = query(
        collection(firestore, "comments"),
        where("postId", "==", selectedPost.id),
        orderBy("createdAt", "desc")
      );
      const commentDocs = await getDocs(commentsQuery);
      const mappedComments = commentDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(mappedComments as Comment[]);
    } catch (error: any) {
      console.log("getPostComments error", error);
      showToast({
        title: "Error fetching comments",
        description: "There was an error fetching comments",
        status: "error",
      });
    } finally {
      setCommentFetchLoading(false);
    }
  }, [selectedPost, showToast]);

  useEffect(() => {
    if (selectedPost) {
      loadComments();
    }
  }, [selectedPost, loadComments]);

  return {
    comments,
    setComments,
    commentFetchLoading,
    loadComments,
  };
};

export default useCommentList;
