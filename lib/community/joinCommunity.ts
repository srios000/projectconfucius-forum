import { firestore } from "@/firebase/clientApp";
import { CommunitySnippet } from "@/types/community";
import { doc, increment, writeBatch } from "firebase/firestore";

export const joinCommunity = async (
  userId: string,
  communityId: string,
  communityImageURL: string,
  isCreatorOrAdmin: boolean
) => {
  const batch = writeBatch(firestore);

  const newSnippet: CommunitySnippet = {
    communityId: communityId,
    imageURL: communityImageURL || "",
    isAdmin: isCreatorOrAdmin,
  };

  batch.set(
    doc(firestore, `users/${userId}/communitySnippets`, communityId),
    newSnippet
  );

  batch.update(doc(firestore, "communities", communityId), {
    numberOfMembers: increment(1),
  });

  await batch.commit();
  return newSnippet;
};
