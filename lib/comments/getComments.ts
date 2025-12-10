import { firestore } from "@/firebase/clientApp";
import { Comment } from "@/types/comment";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export const getComments = async (postId: string) => {
  const commentsQuery = query(
    collection(firestore, "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "desc")
  );
  const commentDocs = await getDocs(commentsQuery);
  const comments = commentDocs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Comment[];
  return comments;
};
