import { firestore } from "@/firebase/clientApp";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { CommunityMember } from "@/types/communityMember";

/**
 * Fetches users that hold a snippet for the target community.
 * @param communityId - Community id to match in each user's snippets.
 * @returns Sorted list of members with email and display name.
 */
export const fetchCommunityMembers = async (
  communityId: string
): Promise<CommunityMember[]> => {
    const usersSnapshot = await getDocs(collection(firestore, "users"));

    const members = await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const snippetDoc = await getDoc(
          doc(
            firestore,
            "users",
            userDoc.id,
            "communitySnippets",
            communityId
          )
        );

        if (!snippetDoc.exists()) {
          return null;
        }

        const data = userDoc.data() as {
          email?: string;
          displayName?: string | null;
        };

        return {
          uid: userDoc.id,
          email: data.email || "Unknown email",
          displayName: data.displayName ?? null,
        } satisfies CommunityMember;
      })
    );

    const filteredMembers = members.filter(
      (member): member is CommunityMember => !!member
    );

    filteredMembers.sort((a, b) => {
      const nameA = (a.displayName || a.email).toLowerCase();
      const nameB = (b.displayName || b.email).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return filteredMembers;
};
