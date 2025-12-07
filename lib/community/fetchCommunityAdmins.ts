import { firestore } from "@/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";

import { AdminUser } from "../../types/adminUser";

/**
 * Fetches all admins for a community.
 * Includes the community creator and all additional admins.
 * @param creatorId - The UID of the community creator
 * @param adminIds - Array of admin UIDs (not including the creator)
 * @returns Promise<AdminUser[]> - Array of admin users
 */
export const fetchCommunityAdmins = async (
  creatorId: string,
  adminIds?: string[]
): Promise<AdminUser[]> => {
  const allAdminIds = [creatorId, ...(adminIds || [])];
  const uniqueAdminIds = Array.from(new Set(allAdminIds));

  const adminPromises = uniqueAdminIds.map((uid) =>
    getDoc(doc(firestore, "users", uid))
  );
  const adminDocs = await Promise.all(adminPromises);

  const adminUsers = adminDocs
    .map((doc) => {
      if (doc.exists()) {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
        } as AdminUser;
      }
      return null;
    })
    .filter((user): user is AdminUser => user !== null);

  return adminUsers;
};
