import { firestore } from "@/firebase/clientApp";
import { doc, increment, writeBatch } from "firebase/firestore";

export const leaveCommunity = async (userId: string, communityId: string) => {
  const batch = writeBatch(firestore);

  batch.delete(
    doc(firestore, `users/${userId}/communitySnippets`, communityId)
  );

  batch.update(doc(firestore, "communities", communityId), {
    numberOfMembers: increment(-1),
  });

  await batch.commit();
};
