import { useCallback } from "react";
import {
  findUserByEmailAction,
  searchUsersByEmailAction,
} from "@/app/actions/reads";

/**
 * A custom hook that provides utility functions for searching and finding users by email.
 * This is primarily used in the moderator management interface.
 * @returns An object containing functions for searching multiple users and finding a single user by email.
 */
const useAdminSearch = () => {
  const searchUsers = useCallback(async (emailQuery: string) => {
    try {
      return await searchUsersByEmailAction(emailQuery);
    } catch (error: any) {
      console.error("Error searching users", error);
      return [];
    }
  }, []);

  const findUser = useCallback(async (email: string) => {
    try {
      return await findUserByEmailAction(email);
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
