import { firestore } from "@/firebase/clientApp";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

/**
 * Updates the name of the creator of the comments.
 * Finds all the comments a user has created and updates the creator name.
 * @param userId - Id of the user whose comments are to be updated.
 * @param newUserName - New display name to store on past comments.
 * @returns Resolves when every comment document has been updated.
 */
export const updateUserCommentsName = async (
  userId: string,
  newUserName: string
) => {
  const commentsQuery = query(
    collection(firestore, "comments"),
    where("creatorId", "==", userId)
  );
  const commentsSnapshot = await getDocs(commentsQuery);

  const batch = writeBatch(firestore);

  commentsSnapshot.forEach((commentDoc) => {
    const commentRef = doc(firestore, "comments", commentDoc.id);
    batch.update(commentRef, { creatorDisplayText: newUserName });
  });

  await batch.commit();
};
