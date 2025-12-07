import { useCallback } from "react";
import { AdminUser } from "@/types/adminUserType";
import { findUserByEmail } from "@/lib/community/findUserByEmail";
import { searchUsersByEmail } from "@/lib/community/searchUsersByEmail";

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
