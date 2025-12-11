import { firestore } from "@/firebase/clientApp";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

/**
 * Updates the name of the creator of the posts.
 * Finds all the posts a user has created and updates the creator name.
 * @param userId - Id of the user whose posts are updated.
 * @param newUserName - New display name or email-derived label.
 * @returns Resolves when every post document has been updated.
 */
export const updateUserPostsName = async (
  userId: string,
  newUserName: string
) => {
  const postsQuery = query(
    collection(firestore, "posts"),
    where("creatorId", "==", userId)
  );
  const postsSnapshot = await getDocs(postsQuery);

  const batch = writeBatch(firestore);

  postsSnapshot.forEach((postDoc) => {
    const postRef = doc(firestore, "posts", postDoc.id);
    batch.update(postRef, { creatorUsername: newUserName });
  });

  await batch.commit();
};
