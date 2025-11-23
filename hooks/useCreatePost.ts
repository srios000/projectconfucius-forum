import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { firestore, storage } from "@/firebase/clientApp";
import { Post } from "@/atoms/postsAtom";
import useCustomToast from "@/hooks/useCustomToast";

const useCreatePost = () => {
  const router = useRouter();
  const showToast = useCustomToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleCreatePost = async (
    user: User,
    communityId: string,
    communityImageURL: string | undefined,
    postData: { title: string; body: string },
    selectedFile?: string
  ) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create post object
      const newPost: Post = {
        communityId,
        communityImageURL: communityImageURL || "",
        creatorId: user.uid,
        creatorUsername: user.displayName || user.email!.split("@")[0],
        title: postData.title,
        body: postData.body,
        numberOfComments: 0,
        voteStatus: 0,
        createTime: serverTimestamp() as Timestamp,
      };

      // 2. Store post in firestore
      const postDocRef = await addDoc(collection(firestore, "posts"), newPost);

      // 3. Check for selectedFile
      if (selectedFile) {
        // 4. Store in storage => getURL (return imageURL)
        const imageRef = ref(storage, `posts/${postDocRef.id}/image`);
        await uploadString(imageRef, selectedFile, "data_url");
        const downloadURL = await getDownloadURL(imageRef);

        // 5. Update post doc by adding imageURL
        await updateDoc(doc(firestore, "posts", postDocRef.id), {
          imageURL: downloadURL,
        });
      }

      // 6. Redirect to community page
      router.back();
      showToast({
        title: "Post Created",
        description: "Your post has been created successfully",
        status: "success",
      });
    } catch (error: any) {
      console.log("handleCreatePost error", error);
      setError(true);
      showToast({
        title: "Error Creating Post",
        description: "There was an error creating your post",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    handleCreatePost,
    loading,
    error,
  };
};

export default useCreatePost;
