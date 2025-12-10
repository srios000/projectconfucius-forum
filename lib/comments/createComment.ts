import { firestore } from "@/firebase/clientApp";
import { Comment } from "@/types/comment";
import {
  collection,
  doc,
  increment,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { User } from "firebase/auth";

export const createComment = async (
  user: User,
  communityId: string,
  postId: string,
  postTitle: string,
  commentText: string,
  parentId?: string
) => {
  const batch = writeBatch(firestore);
  const commentDocRef = doc(collection(firestore, "comments"));
  const newComment: Comment = {
    id: commentDocRef.id,
    creatorId: user.uid,
    creatorDisplayText: user.email!.split("@")[0],
    communityId: communityId,
    postId: postId,
    postTitle: postTitle,
    text: commentText,
    createdAt: serverTimestamp() as Timestamp,
    parentId: parentId || undefined,
  };

  if (!parentId) delete newComment.parentId;

  batch.set(commentDocRef, newComment);

  const postDocRef = doc(firestore, "posts", postId);
  batch.update(postDocRef, {
    numberOfComments: increment(1),
  });

  await batch.commit();
  return newComment;
};
