import { storage } from "@/firebase/clientApp";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

/**
 * Uploads a profile image to Firebase Storage.
 * @param userId - ID of the user
 * @param selectedFile - Base64 string of the image
 * @returns Download URL of the uploaded image
 */
export const uploadProfileImage = async (
  userId: string,
  selectedFile: string
) => {
  const imageRef = ref(storage, `users/${userId}/profileImage`);
  await uploadString(imageRef, selectedFile, "data_url");
  return await getDownloadURL(imageRef);
};
