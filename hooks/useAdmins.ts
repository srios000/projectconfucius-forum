"use client";

import { useCallback, useState } from "react";
import {
  AdminUser,
  fetchCommunityAdmins,
  searchUsersByEmail,
  findUserByEmail,
  addCommunityAdmin,
  removeCommunityAdmin,
} from "@/lib/communityAdmins";
import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { useSetAtom } from "jotai";

const useAdmins = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const setCommunityStateValue = useSetAtom(communityStateAtom);

  const loadAdmins = useCallback(
    async (creatorId: string, adminIds?: string[]) => {
      setLoading(true);
      try {
        const result = await fetchCommunityAdmins(creatorId, adminIds);
        setAdmins(result);
      } catch (error: any) {
        console.error("Error fetching admins", error);
        setAdmins([]);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

  const handleAddAdmin = useCallback(
    async (
      communityId: string,
      newUser: AdminUser,
      communityImageURL?: string
    ) => {
      try {
        // Add admin in Firestore
        await addCommunityAdmin(communityId, newUser.uid, communityImageURL);

        // Update local state
        setAdmins((prev) => [...prev, newUser]);

        // Update global state
        setCommunityStateValue((prev) => ({
          ...prev,
          currentCommunity: {
            ...prev.currentCommunity!,
            adminIds: [...(prev.currentCommunity?.adminIds || []), newUser.uid],
          } as Community,
        }));
      } catch (error: any) {
        console.error("Error adding admin", error);
        throw error;
      }
    },
    [setCommunityStateValue]
  );

  const handleRemoveAdmin = useCallback(
    async (communityId: string, userId: string) => {
      try {
        // Remove admin in Firestore
        await removeCommunityAdmin(communityId, userId);

        // Update local state
        setAdmins((prev) => prev.filter((admin) => admin.uid !== userId));

        // Update global state
        setCommunityStateValue((prev) => ({
          ...prev,
          currentCommunity: {
            ...prev.currentCommunity!,
            adminIds: (prev.currentCommunity?.adminIds || []).filter(
              (id) => id !== userId
            ),
          } as Community,
        }));
      } catch (error: any) {
        console.error("Error removing admin", error);
        throw error;
      }
    },
    [setCommunityStateValue]
  );

  return {
    admins,
    setAdmins,
    loading,
    loadAdmins,
    searchUsers,
    findUser,
    handleAddAdmin,
    handleRemoveAdmin,
  };
};

export default useAdmins;
