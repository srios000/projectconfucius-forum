import { firestore } from "@/firebase/clientApp";
import { Community } from "@/types/community";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";

export const getCommunities = async (
  limitValue: number,
  lastVisible?: QueryDocumentSnapshot<DocumentData> | null
) => {
  let communityQuery;
  if (!lastVisible) {
    communityQuery = query(
      collection(firestore, "communities"),
      orderBy("numberOfMembers", "desc"),
      limit(limitValue)
    );
  } else {
    communityQuery = query(
      collection(firestore, "communities"),
      orderBy("numberOfMembers", "desc"),
      startAfter(lastVisible),
      limit(limitValue)
    );
  }

  const communityDocs = await getDocs(communityQuery);
  const communities = communityDocs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Community[];

  const newLastVisible =
    communityDocs.docs.length > 0
      ? communityDocs.docs[communityDocs.docs.length - 1]
      : null;

  return { communities, newLastVisible };
};
