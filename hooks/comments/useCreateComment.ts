import { Dispatch, SetStateAction, useState } from "react";
import { User } from "firebase/auth";
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/firebase/clientApp";
import { Post, postStateAtom } from "@/atoms/postsAtom";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";
import { Comment } from "./types";

const useCreateComment = (
  selectedPost: Post | null,
  setComments: Dispatch<SetStateAction<Comment[]>>
) => {
  const setPostState = useSetAtom(postStateAtom);
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);

  const createComment = async (
    user: User,
    commentText: string,
    parentId?: string
  ) => {
    if (!selectedPost) return;
    setCreateLoading(true);
    try {
      const batch = writeBatch(firestore);

      const commentDocRef = doc(collection(firestore, "comments"));
      const newComment: Comment = {
        id: commentDocRef.id,
        creatorId: user.uid,
        creatorDisplayText: user.email!.split("@")[0],
        communityId: selectedPost.communityId,
        postId: selectedPost.id!,
        postTitle: selectedPost.title,
        text: commentText,
        createdAt: serverTimestamp() as Timestamp,
        parentId: parentId || undefined,
      };

      if (!parentId) delete newComment.parentId;

      batch.set(commentDocRef, newComment);

      const postDocRef = doc(firestore, "posts", selectedPost.id!);
      batch.update(postDocRef, {
        numberOfComments: increment(1),
      });

      await batch.commit();

      setComments((prev) => [newComment, ...prev]);
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost!,
          numberOfComments: prev.selectedPost!.numberOfComments + 1,
        },
      }));
    } catch (error: any) {
      console.log("onCreateComment error", error);
      showToast({
        title: "Comment failed",
        description: "There was an error creating your comment",
        status: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    createComment,
    createLoading,
  };
};

export default useCreateComment;
