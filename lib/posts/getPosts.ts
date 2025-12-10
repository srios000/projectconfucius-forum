import { firestore } from "@/firebase/clientApp";
import { Post } from "@/types/post";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";

export const getPosts = async (
  communityId?: string,
  communityIds?: string[],
  isGenericHome?: boolean,
  lastVisible?: QueryDocumentSnapshot<DocumentData> | null
) => {
  const constraints: QueryConstraint[] = [];

  if (communityId) {
    constraints.push(where("communityId", "==", communityId));
    constraints.push(orderBy("createTime", "desc"));
  } else if (communityIds && communityIds.length > 0) {
    constraints.push(where("communityId", "in", communityIds));
    constraints.push(orderBy("createTime", "desc"));
  } else if (isGenericHome) {
    constraints.push(orderBy("voteStatus", "desc"));
  }

  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }

  constraints.push(limit(10));

  const postQuery = query(collection(firestore, "posts"), ...constraints);
  const postDocs = await getDocs(postQuery);
  const posts = postDocs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[];

  const newLastVisible =
    postDocs.docs.length > 0 ? postDocs.docs[postDocs.docs.length - 1] : null;

  return { posts, newLastVisible };
};
