import { firestore } from "@/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import safeJsonStringify from "safe-json-stringify";

export async function getCommunityData(communityId: string) {
  try {
    const communityDocRef = doc(firestore, "communities", communityId);
    const communityDoc = await getDoc(communityDocRef);

    if (!communityDoc.exists()) {
      return null;
    }

    return JSON.parse(
      safeJsonStringify({ id: communityDoc.id, ...communityDoc.data() })
    );
  } catch (error) {
    console.log("Error: getCommunityData", error);
    throw error;
  }
}
