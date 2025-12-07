import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";

/**
 * Updates the name of the creator of the comments.
 * Finds all the comments a user has created and updates the creator name.
 * @param {string} userId - ID of the user whose comments are to be updated
 * @param {string} newUserName - New name of the user
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

/**
 * Updates the name of the creator of the posts.
 * Finds all the posts a user has created and updates the creator name.
 * @param {string} userId - ID of the user whose posts are to be updated
 * @param {string} newUserName - New name of the user
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

/**
 * Uploads a profile image to Firebase Storage.
 * @param {string} userId - ID of the user
 * @param {string} selectedFile - Base64 string of the image
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export const uploadProfileImage = async (
  userId: string,
  selectedFile: string
) => {
  const imageRef = ref(storage, `users/${userId}/profileImage`);
  await uploadString(imageRef, selectedFile, "data_url");
  return await getDownloadURL(imageRef);
};

/**
 * Deletes the profile image from Firebase Storage.
 * @param {string} userId - ID of the user
 */
export const deleteProfileImage = async (userId: string) => {
  const imageRef = ref(storage, `users/${userId}/profileImage`);
  await deleteObject(imageRef);
};
