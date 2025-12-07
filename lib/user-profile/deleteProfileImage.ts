import { storage } from "@/firebase/clientApp";
import { deleteObject, ref } from "firebase/storage";

/**
 * Deletes the profile image from Firebase Storage.
 * @param userId - ID of the user
 */
export const deleteProfileImage = async (userId: string) => {
  const imageRef = ref(storage, `users/${userId}/profileImage`);
  await deleteObject(imageRef);
};
