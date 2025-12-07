import { Post, postStateAtom } from "@/atoms/postsAtom";
import { savedPostStateAtom } from "@/atoms/savedPostsAtom";
import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useAtom, useSetAtom } from "jotai";
import React from "react";

const usePostDeletion = (
  setPostStateValue: React.Dispatch<
    React.SetStateAction<{
      selectedPost: Post | null;
      posts: Post[];
      postVotes: import("@/atoms/postsAtom").PostVote[];
    }>
  >
) => {
  const [postStateValue] = useAtom(postStateAtom);
  const setSavedPostState = useSetAtom(savedPostStateAtom);

  const onDeletePost = async (post: Post): Promise<boolean> => {
    setPostStateValue((prev) => ({
      ...prev,
      posts: prev.posts.filter((item) => item.id !== post.id),
    }));

    setSavedPostState((prev) => ({
      ...prev,
      savedPosts: prev.savedPosts.filter((item) => item.postId !== post.id),
    }));

    try {
      if (post.imageURL) {
        const imageRef = ref(storage, `posts/${post.id}/image`);
        await deleteObject(imageRef);
      }

      const postDocRef = doc(firestore, "posts", post.id!);
      await deleteDoc(postDocRef);

      const commentsQuery = query(
        collection(firestore, "comments"),
        where("postId", "==", post.id)
      );
      const commentDocs = await getDocs(commentsQuery);
      const batch = writeBatch(firestore);
      commentDocs.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();

      return true;
    } catch (error) {
      console.log("Error deleting post", error);
      setPostStateValue((prev) => ({
        ...prev,
        posts: [...prev.posts, post],
      }));
      return false;
    }
  };

  return { onDeletePost, postStateValue };
};

export default usePostDeletion;
