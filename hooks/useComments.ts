import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/firebase/clientApp";
import { Post, postStateAtom } from "@/atoms/postsAtom";
import { useSetAtom } from "jotai";
import useCustomToast from "@/hooks/useCustomToast";

export type Comment = {
  id: string;
  creatorId: string;
  creatorDisplayText: string;
  communityId: string;
  postId: string;
  postTitle: string;
  text: string;
  createdAt: Timestamp;
  parentId?: string;
};

const useComments = (selectedPost: Post | null) => {
  const setPostState = useSetAtom(postStateAtom);
  const showToast = useCustomToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFetchLoading, setCommentFetchLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState("");

  const onCreateComment = async (
    user: User,
    commentText: string,
    parentId?: string
  ) => {
    if (!selectedPost) return;
    setCreateLoading(true);
    try {
      const batch = writeBatch(firestore);

      // Create comment document
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

      // Remove parentId if it is null/undefined to avoid saving null in db if preferred,
      // but explicit null is fine too. Let's keep it simple.
      if (!parentId) delete newComment.parentId;

      batch.set(commentDocRef, newComment);

      // Update post numberOfComments +1
      const postDocRef = doc(firestore, "posts", selectedPost.id!);
      batch.update(postDocRef, {
        numberOfComments: increment(1),
      });

      await batch.commit();

      // Update client state
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

  const onDeleteComment = async (comment: Comment) => {
    setDeleteLoadingId(comment.id);
    try {
      const batch = writeBatch(firestore);

      // Find all descendant comments
      const getDescendantIds = (parentId: string): string[] => {
        const children = comments.filter((c) => c.parentId === parentId);
        let ids = children.map((c) => c.id);
        children.forEach((child) => {
          ids = [...ids, ...getDescendantIds(child.id)];
        });
        return ids;
      };

      const descendantIds = getDescendantIds(comment.id);
      const allIdsToDelete = [comment.id, ...descendantIds];

      // Delete comment document and descendants
      allIdsToDelete.forEach((id) => {
        const commentDocRef = doc(firestore, "comments", id);
        batch.delete(commentDocRef);
      });

      // Update post numberOfComments
      const postDocRef = doc(firestore, "posts", comment.postId);
      batch.update(postDocRef, {
        numberOfComments: increment(-allIdsToDelete.length),
      });

      await batch.commit();

      // Update client state
      setComments((prev) =>
        prev.filter((item) => !allIdsToDelete.includes(item.id))
      );
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost!,
          numberOfComments:
            prev.selectedPost!.numberOfComments - allIdsToDelete.length,
        },
      }));
    } catch (error: any) {
      console.log("onDeleteComment error", error);
      showToast({
        title: "Delete failed",
        description: "There was an error deleting your comment",
        status: "error",
      });
    } finally {
      setDeleteLoadingId("");
    }
  };

  const getPostComments = useCallback(async () => {
    if (!selectedPost) return;
    setCommentFetchLoading(true);
    try {
      const commentsQuery = query(
        collection(firestore, "comments"),
        where("postId", "==", selectedPost.id),
        orderBy("createdAt", "desc")
      );
      const commentDocs = await getDocs(commentsQuery);
      const comments = commentDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(comments as Comment[]);
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
      getPostComments();
    }
  }, [selectedPost, getPostComments]);

  return {
    comments,
    setComments,
    onCreateComment,
    onDeleteComment,
    commentFetchLoading,
    createLoading,
    deleteLoadingId,
  };
};

export default useComments;
