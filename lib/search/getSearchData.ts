import { firestore } from "@/firebase/clientApp";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export const getSearchData = async () => {
  const communitiesQuery = query(
    collection(firestore, "communities"),
    where("privacyType", "==", "public")
  );
  const communitiesSnap = await getDocs(communitiesQuery);
  const communities = communitiesSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Community)
  );

  const postsQuery = query(
    collection(firestore, "posts"),
    orderBy("createTime", "desc"),
    limit(100)
  );
  const postsSnap = await getDocs(postsQuery);
  const posts = postsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Post)
  );

  return { communities, posts };
};
