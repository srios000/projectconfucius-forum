import { firestore } from "@/firebase/clientApp";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

import { AdminUser } from "../../types/adminUser";

/**
 * Searches for users by email.
 * Returns up to 5 matching users.
 * @param emailQuery - Email search term typed by the admin.
 * @returns Array of matching users with id and profile info.
 */
export const searchUsersByEmail = async (
  emailQuery: string
): Promise<AdminUser[]> => {
  if (emailQuery.length < 3) {
    return [];
  }

  const usersQuery = query(
    collection(firestore, "users"),
    where("email", ">=", emailQuery),
    where("email", "<=", emailQuery + "\uf8ff"),
    limit(5)
  );

  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map(
    (doc) => ({ uid: doc.id, ...doc.data() } as AdminUser)
  );
};
