import { firestore, storage } from "@/firebase/clientApp";
import { Post } from "@/types/post";
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

/**
 * Deletes a post, its storage image, and all related comments.
 * @param post - Post entity containing id and optional image url.
 * @returns Resolves when Firestore and Storage cleanups finish.
 * @see https://firebase.google.com/docs/firestore/manage-data/delete-data
 */
export const deletePost = async (post: Post) => {
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
};
