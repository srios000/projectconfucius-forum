"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  findUserByEmailAction,
  searchUsersByEmailAction,
} from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

/**
 * A custom hook that provides utility functions for searching and finding users by email.
 * This is primarily used in the moderator management interface.
 * @returns An object containing functions for searching multiple users and finding a single user by email.
 */
const useAdminSearch = () => {
  const queryClient = useQueryClient();

  const searchUsers = useCallback(
    async (emailQuery: string) => {
      const trimmed = emailQuery.trim();
      if (!trimmed) return [];
      try {
        return await queryClient.fetchQuery({
          queryKey: keys.admin.search(trimmed),
          queryFn: () => searchUsersByEmailAction(trimmed),
        });
      } catch (error) {
        console.error("Error searching users", error);
        return [];
      }
    },
    [queryClient],
  );

  const findUser = useCallback(
    async (email: string) => {
      try {
        return await queryClient.fetchQuery({
          queryKey: [...keys.admin.search(email), "exact"] as const,
          queryFn: () => findUserByEmailAction(email),
        });
      } catch (error) {
        console.error("Error finding user", error);
        throw error;
      }
    },
    [queryClient],
  );

  return { searchUsers, findUser };
};

export default useAdminSearch;