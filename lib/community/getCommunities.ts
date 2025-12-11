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

/**
 * Retrieves a page of communities ordered by member count for the discovery feed.
 * Supports pagination via the last visible document reference.
 * @param limitValue - Number of documents to fetch.
 * @param lastVisible - Last document from the previous page, if any.
 * @returns Community list and new cursor for subsequent fetches.
 */
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
