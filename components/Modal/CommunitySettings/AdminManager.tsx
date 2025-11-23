import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { auth, firestore } from "@/firebase/clientApp";
import useCustomToast from "@/hooks/useCustomToast";
import {
  Box,
  Button,
  Flex,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
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
import { useSetAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

type AdminManagerProps = {
  communityData: Community;
};

type AdminUser = {
  uid: string;
  email: string;
  displayName?: string;
};

const AdminManager: React.FC<AdminManagerProps> = ({ communityData }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [showResults, setShowResults] = useState(false);
  const showToast = useCustomToast();
  const setCommunityStateValue = useSetAtom(communityStateAtom);
  const [user] = useAuthState(auth);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const adminIds = [
        communityData.creatorId,
        ...(communityData.adminIds || []),
      ];
      // Remove duplicates just in case
      const uniqueAdminIds = Array.from(new Set(adminIds));

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

      setAdmins(adminUsers);
    } catch (error: any) {
      console.error("Error fetching admins", error);
      showToast({
        title: "Error",
        description: "Could not fetch admins",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [communityData]);

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return;
    setAddingAdmin(true);
    try {
      // 1. Find user by email
      const usersQuery = query(
        collection(firestore, "users"),
        where("email", "==", newAdminEmail)
      );
      const userDocs = await getDocs(usersQuery);

      if (userDocs.empty) {
        showToast({
          title: "User not found",
          description: "No user found with that email",
          status: "error",
        });
        setAddingAdmin(false);
        return;
      }

      const newUserDoc = userDocs.docs[0];
      const newUser = { uid: newUserDoc.id, ...newUserDoc.data() } as AdminUser;

      // 2. Check if already admin
      if (admins.some((admin) => admin.uid === newUser.uid)) {
        showToast({
          title: "Already admin",
          description: "This user is already an admin",
          status: "warning",
        });
        setAddingAdmin(false);
        return;
      }

      // 3. Update community doc and user snippet
      await runTransaction(firestore, async (transaction) => {
        const communityRef = doc(firestore, "communities", communityData.id);
        const snippetRef = doc(
          firestore,
          `users/${newUser.uid}/communitySnippets/${communityData.id}`
        );

        // Check if snippet exists (user might not be a member)
        // If not a member, we can still make them admin?
        // Usually admins should be members.
        // For simplicity, let's assume they become a member if they aren't,
        // or we just create the snippet with isAdmin: true.

        const snippetDoc = await transaction.get(snippetRef);

        transaction.update(communityRef, {
          adminIds: arrayUnion(newUser.uid),
        });

        if (snippetDoc.exists()) {
          transaction.update(snippetRef, {
            isAdmin: true,
          });
        } else {
          // If they are not a member, we create a snippet for them
          transaction.set(snippetRef, {
            communityId: communityData.id,
            imageURL: communityData.imageURL || "",
            isAdmin: true,
          });

          // Increment member count since we added a new member
          transaction.update(communityRef, {
            numberOfMembers: increment(1),
          });
        }
      });

      // Update local state
      setAdmins((prev) => [...prev, newUser]);
      setNewAdminEmail("");

      // Update global state
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity!,
          adminIds: [...(prev.currentCommunity?.adminIds || []), newUser.uid],
        } as Community,
      }));

      showToast({
        title: "Admin added",
        description: `${newUser.email} is now an admin`,
        status: "success",
      });
    } catch (error: any) {
      console.error("Error adding admin", error);
      showToast({
        title: "Error",
        description: "Could not add admin",
        status: "error",
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (uid: string) => {
    try {
      const snippetRef = doc(
        firestore,
        `users/${uid}/communitySnippets/${communityData.id}`
      );
      const snippetDoc = await getDoc(snippetRef);

      // 1. Update community doc and user snippet
      const batch = writeBatch(firestore);
      const communityRef = doc(firestore, "communities", communityData.id);

      batch.update(communityRef, {
        adminIds: arrayRemove(uid),
      });

      if (snippetDoc.exists()) {
        batch.update(snippetRef, {
          isAdmin: false,
        });
      }

      await batch.commit();

      // Update local state
      setAdmins((prev) => prev.filter((admin) => admin.uid !== uid));

      // Update global state
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity!,
          adminIds: (prev.currentCommunity?.adminIds || []).filter(
            (id) => id !== uid
          ),
        } as Community,
      }));

      showToast({
        title: "Admin removed",
        description: "User is no longer an admin",
        status: "success",
      });
    } catch (error: any) {
      console.error("Error removing admin", error);
      showToast({
        title: "Error",
        description: "Could not remove admin",
        status: "error",
      });
    }
  };

  useEffect(() => {
    const searchUsers = async () => {
      if (newAdminEmail.length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      try {
        const usersQuery = query(
          collection(firestore, "users"),
          where("email", ">=", newAdminEmail),
          where("email", "<=", newAdminEmail + "\uf8ff"),
          limit(5)
        );
        const snapshot = await getDocs(usersQuery);
        const results = snapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as AdminUser)
        );
        // Filter out existing admins
        const filtered = results.filter(
          (u) => !admins.some((a) => a.uid === u.uid)
        );
        setSearchResults(filtered);
        setShowResults(true);
      } catch (error) {
        console.error(error);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [newAdminEmail, admins]);

  return (
    <Stack gap={4}>
      <Text fontSize="lg" fontWeight={600}>
        Manage Admins
      </Text>

      <Box position="relative">
        <Flex gap={2}>
          <Input
            placeholder="Enter email to add admin"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            onFocus={() => newAdminEmail.length >= 3 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          <Button
            onClick={handleAddAdmin}
            loading={addingAdmin}
            disabled={!newAdminEmail}
          >
            Add
          </Button>
        </Flex>
        {showResults && searchResults.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={1000}
            bg="white"
            _dark={{ bg: "gray.700", borderColor: "gray.600" }}
            shadow="md"
            borderRadius="md"
            maxH="200px"
            overflowY="auto"
            border="1px solid"
            borderColor="gray.200"
          >
            {searchResults.map((user) => (
              <Box
                key={user.uid}
                p={2}
                cursor="pointer"
                _hover={{ bg: "gray.100", _dark: { bg: "gray.600" } }}
                onClick={() => {
                  setNewAdminEmail(user.email);
                  setShowResults(false);
                }}
              >
                <Text fontSize="sm" fontWeight="bold">
                  {user.email}
                </Text>
                {user.displayName && (
                  <Text fontSize="xs" color="gray.500">
                    {user.displayName}
                  </Text>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {loading ? (
        <Flex justify="center" p={4}>
          <Spinner />
        </Flex>
      ) : (
        <Stack gap={2}>
          {admins.map((admin) => (
            <Flex
              key={admin.uid}
              align="center"
              justify="space-between"
              p={2}
              borderWidth="1px"
              borderRadius="md"
            >
              <Stack gap={0}>
                <Text fontWeight={600}>{admin.displayName || "No Name"}</Text>
                <Text fontSize="sm" color="gray.500">
                  {admin.email}
                </Text>
              </Stack>
              {admin.uid !== communityData.creatorId &&
                admin.uid !== user?.uid && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => handleRemoveAdmin(admin.uid)}
                  >
                    Remove
                  </Button>
                )}
              {admin.uid === communityData.creatorId && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  Creator
                </Text>
              )}
            </Flex>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default AdminManager;
