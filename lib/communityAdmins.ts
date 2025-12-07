import { firestore } from "@/firebase/clientApp";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  runTransaction,
  where,
  writeBatch,
} from "firebase/firestore";

export type AdminUser = {
  uid: string;
  email: string;
  displayName?: string;
};

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
  // Remove duplicates
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

/**
 * Searches for users by email.
 * Returns up to 5 matching users.
 * @param emailQuery - The email search term
 * @returns Promise<AdminUser[]> - Array of matching users
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

/**
 * Adds a user as an admin to a community.
 * Creates a community snippet for the user if they aren't a member yet.
 * @param communityId - The community ID
 * @param userId - The user ID to make admin
 * @param communityImageURL - The community image URL (for snippet creation)
 * @returns Promise<void>
 */
export const addCommunityAdmin = async (
  communityId: string,
  userId: string,
  communityImageURL?: string
): Promise<void> => {
  await runTransaction(firestore, async (transaction) => {
    const communityRef = doc(firestore, "communities", communityId);
    const snippetRef = doc(
      firestore,
      `users/${userId}/communitySnippets/${communityId}`
    );

    const snippetDoc = await transaction.get(snippetRef);

    transaction.update(communityRef, {
      adminIds: arrayUnion(userId),
    });

    if (snippetDoc.exists()) {
      transaction.update(snippetRef, {
        isAdmin: true,
      });
    } else {
      // If they are not a member, create a snippet for them
      transaction.set(snippetRef, {
        communityId: communityId,
        imageURL: communityImageURL || "",
        isAdmin: true,
      });

      // Increment member count since we added a new member
      transaction.update(communityRef, {
        numberOfMembers: increment(1),
      });
    }
  });
};

/**
 * Removes a user as an admin from a community.
 * Keeps them as a member but removes admin privileges.
 * @param communityId - The community ID
 * @param userId - The user ID to remove as admin
 * @returns Promise<void>
 */
export const removeCommunityAdmin = async (
  communityId: string,
  userId: string
): Promise<void> => {
  const snippetRef = doc(
    firestore,
    `users/${userId}/communitySnippets/${communityId}`
  );
  const snippetDoc = await getDoc(snippetRef);

  const batch = writeBatch(firestore);
  const communityRef = doc(firestore, "communities", communityId);

  batch.update(communityRef, {
    adminIds: arrayRemove(userId),
  });

  if (snippetDoc.exists()) {
    batch.update(snippetRef, {
      isAdmin: false,
    });
  }

  await batch.commit();
};
