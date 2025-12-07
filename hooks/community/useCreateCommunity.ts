import { auth, firestore } from "@/firebase/clientApp";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import useCustomToast from "../useCustomToast";

export const useCreateCommunity = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const showToast = useCustomToast();

  const createCommunity = async (
    communityName: string,
    communityType: string
  ) => {
    if (error) setError("");
    // prevents community from being created if it has special characters
    const format: RegExp = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    if (format.test(communityName)) {
      setError("Community name can only contain letters and numbers");
      return false;
    }
    // prevents community from being created if its too short
    if (communityName.length < 3) {
      setError("Community name must be at least 3 characters long");
      return false;
    }

    setLoading(true);

    try {
      // check if community exists by using document reference
      // takes firestore object, name of collection in db, and the id (community names are unique)
      const communityDocRef = doc(firestore, "communities", communityName);
      /**
       * if one transaction fails they all fail
       */
      await runTransaction(firestore, async (transaction) => {
        const communityDoc = await transaction.get(communityDocRef);
        if (communityDoc.exists()) {
          // if community exists
          throw new Error(
            `The community ${communityName} is already taken. Try a different name! `
          );
        }

        // create community
        transaction.set(communityDocRef, {
          creatorId: user?.uid,
          createdAt: serverTimestamp(),
          numberOfMembers: 1,
          privacyType: communityType,
        });

        // create community snippet on user
        transaction.set(
          // path: collection/document/collection/...
          doc(firestore, `users/${user?.uid}/communitySnippets`, communityName),
          {
            communityId: communityName,
            isAdmin: true,
          }
        );
      });

      router.push(`/community/${communityName}`);
      return true;
    } catch (error: any) {
      console.log("Error: handleCreateCommunity", error);
      setError(error.message);
      showToast({
        title: "Community not Created",
        description: "There was an error creating your community",
        status: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createCommunity, loading, error, setError };
};
