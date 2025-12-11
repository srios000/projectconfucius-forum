import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

/**
 * Replaces a community image in Storage and updates community and snippet references.
 * Propagates the new URL to every user snippet containing the community.
 * @param communityId - Community id used for the storage path and documents.
 * @param selectedFile - Base64 data URL selected from the client.
 * @returns Public download URL of the uploaded image.
 * @see https://firebase.google.com/docs/storage/web/upload-files
 */
export const updateCommunityImage = async (
  communityId: string,
  selectedFile: string
) => {
  const imageRef = ref(storage, `communities/${communityId}/image`);
  await uploadString(imageRef, selectedFile, "data_url");
  const downloadURL = await getDownloadURL(imageRef);
  await updateDoc(doc(firestore, "communities", communityId), {
    imageURL: downloadURL,
  });

  const usersSnapshot = await getDocs(collection(firestore, "users"));
  const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
    const communitySnippetDoc = await getDoc(
      doc(firestore, "users", userDoc.id, "communitySnippets", communityId)
    );
    if (communitySnippetDoc.exists()) {
      await updateDoc(
        doc(firestore, "users", userDoc.id, "communitySnippets", communityId),
        {
          imageURL: downloadURL,
        }
      );
    }
  });
  await Promise.all(updatePromises);

  return downloadURL;
};
