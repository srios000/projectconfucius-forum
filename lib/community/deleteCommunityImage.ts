import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

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
