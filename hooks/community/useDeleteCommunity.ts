import { Community } from "@/types/community";
import { firestore, storage } from "@/firebase/clientApp";
import {
  collection,
  collectionGroup,
  doc,
  DocumentReference,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useCustomToast from "../useCustomToast";

/**
 * Deletes a community and all related posts, comments, votes, and snippets.
 * @param communityData - Community to remove.
 * @returns Handler that performs the cascade delete and a loading flag.
 */
const useDeleteCommunity = (communityData: Community) => {
  const router = useRouter();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);

  const deleteCommunity = async () => {
    setLoading(true);
    try {
      const postsQuery = query(
        collection(firestore, "posts"),
        where("communityId", "==", communityData.id)
      );
      const postsSnapshot = await getDocs(postsQuery);

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

      if (communityData.imageURL) {
        const imageRef = ref(storage, `communities/${communityData.id}/image`);
        await deleteObject(imageRef).catch((e) =>
          console.log("Error deleting community image", e)
        );
      }

      let docsToDelete: DocumentReference[] = [];
      docsToDelete.push(doc(firestore, "communities", communityData.id));
      postsSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));

      for (const postDoc of postsSnapshot.docs) {
        const commentsQuery = query(
          collection(firestore, "comments"),
          where("postId", "==", postDoc.id)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        commentsSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));

        const votesQuery = query(
          collectionGroup(firestore, "postVotes"),
          where("postId", "==", postDoc.id)
        );
        const votesSnapshot = await getDocs(votesQuery);
        votesSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));
      }

      const snippetsQuery = query(
        collectionGroup(firestore, "communitySnippets"),
        where("communityId", "==", communityData.id)
      );
      const snippetsSnapshot = await getDocs(snippetsQuery);
      snippetsSnapshot.docs.forEach((d) => docsToDelete.push(d.ref));

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

  return { deleteCommunity, loading };
};

export default useDeleteCommunity;
