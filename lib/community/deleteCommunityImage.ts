import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

/**
 * Removes a community image from Storage and clears references from the community and all user snippets.
 * Keeps member thumbnails in sync when admins delete the image.
 * @param communityId - Community id to locate related documents and storage file.
 * @returns Resolves when all documents have been updated.
 * @see https://firebase.google.com/docs/storage/web/delete-files
 */
export const deleteCommunityImage = async (communityId: string) => {
  const imageRef = ref(storage, `communities/${communityId}/image`);
  await deleteObject(imageRef);
  await updateDoc(doc(firestore, "communities", communityId), {
    imageURL: "",
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
          imageURL: "",
        }
      );
    }
  });
  await Promise.all(updatePromises);
};
