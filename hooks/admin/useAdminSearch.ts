import { useCallback } from "react";
import { AdminUser } from "@/types/adminUser";
import { findUserByEmail } from "@/lib/community/findUserByEmail";
import { searchUsersByEmail } from "@/lib/community/searchUsersByEmail";

/**
 * Provides helpers to search for potential admin users by email.
 * @param emailQuery - Partial email string for search.
 * @param email - Exact email to resolve to a user.
 * @returns Functions to search many users or fetch a single user.
 */
const useAdminSearch = () => {
  const searchUsers = useCallback(async (emailQuery: string) => {
    try {
      return await searchUsersByEmail(emailQuery);
    } catch (error: any) {
      console.error("Error searching users", error);
      return [];
    }
  }, []);

  const findUser = useCallback(async (email: string) => {
    try {
      return await findUserByEmail(email);
    } catch (error: any) {
      console.error("Error finding user", error);
      throw error;
    }
  }, []);

  return {
    searchUsers,
    findUser,
  };
};

export default useAdminSearch;
