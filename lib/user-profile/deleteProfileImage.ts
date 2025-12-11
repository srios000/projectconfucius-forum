import { storage } from "@/firebase/clientApp";
import { deleteObject, ref } from "firebase/storage";

/**
 * Deletes the profile image from Firebase Storage.
 * @param userId - Id of the user.
 * @returns Resolves after the storage object is removed.
 */
export const deleteProfileImage = async (userId: string) => {
  const imageRef = ref(storage, `users/${userId}/profileImage`);
  await deleteObject(imageRef);
};
