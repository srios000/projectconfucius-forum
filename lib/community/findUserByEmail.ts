import { firestore } from "@/firebase/clientApp";
import { collection, getDocs, query, where } from "firebase/firestore";

import { AdminUser } from "./adminTypes";

/**
 * Finds a user by their exact email address.
 * @param email - The exact email to search for
 * @returns Promise<AdminUser | null> - The user if found, null otherwise
 */
export const findUserByEmail = async (
  email: string
): Promise<AdminUser | null> => {
  const usersQuery = query(
    collection(firestore, "users"),
    where("email", "==", email)
  );
  const userDocs = await getDocs(usersQuery);

  if (userDocs.empty) {
    return null;
  }

  const userDoc = userDocs.docs[0];
  return { uid: userDoc.id, ...userDoc.data() } as AdminUser;
};
