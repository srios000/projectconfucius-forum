import { Community, communityStateAtom } from "@/atoms/communitiesAtom";
import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  collectionGroup,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useCustomToast from "./useCustomToast";

export const useCommunitySettings = (communityData: Community) => {
  const router = useRouter();
  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const showToast = useCustomToast();

  const updateImage = async (selectedFile: string) => {
    if (!selectedFile) return;
    setUploadingImage(true);

    try {
      const imageRef = ref(storage, `communities/${communityData.id}/image`);
      await uploadString(imageRef, selectedFile, "data_url");
      const downloadURL = await getDownloadURL(imageRef);
      await updateDoc(doc(firestore, "communities", communityData.id), {
        imageURL: downloadURL,
      });

      const usersSnapshot = await getDocs(collection(firestore, "users"));
      usersSnapshot.forEach(async (userDoc) => {
        const communitySnippetDoc = await getDoc(
          doc(
            firestore,
            "users",
            userDoc.id,
            "communitySnippets",
            communityData.id
          )
        );
        if (communitySnippetDoc.exists()) {
          await updateDoc(
            doc(
              firestore,
              "users",
              userDoc.id,
              "communitySnippets",
              communityData.id
            ),
            {
              imageURL: downloadURL,
            }
          );
        }
      });

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          imageURL: downloadURL,
        } as Community,
      }));

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.map((snippet) => {
          if (snippet.communityId === communityData.id) {
            return {
              ...snippet,
              imageURL: downloadURL,
            };
          }
          return snippet;
        }),
      }));
    } catch (error) {
      console.log("Error: onUploadImage", error);
      showToast({
        title: "Image not Updated",
        description: "There was an error updating the image",
        status: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteCommunityImage = async () => {
    try {
      const imageRef = ref(storage, `communities/${communityData.id}/image`);
      await deleteObject(imageRef);
      await updateDoc(doc(firestore, "communities", communityData.id), {
        imageURL: "",
      });

      const usersSnapshot = await getDocs(collection(firestore, "users"));
      usersSnapshot.forEach(async (userDoc) => {
        const communitySnippetDoc = await getDoc(
          doc(
            firestore,
            "users",
            userDoc.id,
            "communitySnippets",
            communityData.id
          )
        );
        if (communitySnippetDoc.exists()) {
          await updateDoc(
            doc(
              firestore,
              "users",
              userDoc.id,
              "communitySnippets",
              communityData.id
            ),
            {
              imageURL: "",
            }
          );
        }
      });

      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          imageURL: "",
        } as Community,
      }));

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.map((snippet) => {
          if (snippet.communityId === communityData.id) {
            return {
              ...snippet,
              imageURL: "",
            };
          }
          return snippet;
        }),
      }));
    } catch (error) {
      console.log("Error: onDeleteImage", error);
      showToast({
        title: "Image not Deleted",
        description: "There was an error deleting the image",
        status: "error",
      });
    }
  };

  const updatePrivacyType = async (privacyType: string) => {
    try {
      await updateDoc(doc(firestore, "communities", communityData.id), {
        privacyType,
      });
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
          ...prev.currentCommunity,
          privacyType: privacyType,
        } as Community,
      }));
    } catch (error) {
      console.log("Error: onUpdateCommunityPrivacyType", error);
      showToast({
        title: "Privacy Type not Updated",
        description: "There was an error updating the community privacy type",
        status: "error",
      });
    }
  };

  const deleteCommunity = async () => {
    setLoading(true);
    try {
      // 1. Get all posts
      const postsQuery = query(
        collection(firestore, "posts"),
        where("communityId", "==", communityData.id)
      );
      const postsSnapshot = await getDocs(postsQuery);

      // 2. Delete Post Images (Storage)
      const deletePostImagePromises: Promise<void>[] = [];
      postsSnapshot.docs.forEach((doc) => {
        const post = doc.data();
        if (post.imageURL) {
          const imageRef = ref(storage, `posts/${doc.id}/image`);
          deletePostImagePromises.push(
            deleteObject(imageRef).catch((e) =>
              console.log("Error deleting post image", e)
            )
          );
        }
      });
      await Promise.all(deletePostImagePromises);

      // 3. Delete Community Image (Storage)
      if (communityData.imageURL) {
        const imageRef = ref(storage, `communities/${communityData.id}/image`);
        await deleteObject(imageRef).catch((e) =>
          console.log("Error deleting community image", e)
        );
      }

      // 4. Collect all documents to delete
      let docsToDelete: DocumentReference[] = [];

      // Community Doc
      docsToDelete.push(doc(firestore, "communities", communityData.id));

      // Posts
      postsSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));

      // Comments (for each post)
      for (const postDoc of postsSnapshot.docs) {
        const commentsQuery = query(
          collection(firestore, "comments"),
          where("postId", "==", postDoc.id)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        commentsSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));

        // Post Votes (subcollection of users)
        const votesQuery = query(
          collectionGroup(firestore, "postVotes"),
          where("postId", "==", postDoc.id)
        );
        const votesSnapshot = await getDocs(votesQuery);
        votesSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));
      }

      // Community Snippets (subcollection of users)
      const snippetsQuery = query(
        collectionGroup(firestore, "communitySnippets"),
        where("communityId", "==", communityData.id)
      );
      const snippetsSnapshot = await getDocs(snippetsQuery);
      snippetsSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));

      // 5. Batch Delete
      const chunkArray = (arr: any[], size: number) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      const chunks = chunkArray(docsToDelete, 450);
      for (const chunk of chunks) {
        const batch = writeBatch(firestore);
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      showToast({
        title: "Community Deleted",
        description: "Community has been deleted successfully",
        status: "success",
      });

      router.push("/");
    } catch (error) {
      console.log("Error: deleteCommunity", error);
      showToast({
        title: "Community not Deleted",
        description: "There was an error deleting the community",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    updateImage,
    deleteCommunityImage,
    updatePrivacyType,
    uploadingImage,
    deleteCommunity,
    loading,
  };
};
