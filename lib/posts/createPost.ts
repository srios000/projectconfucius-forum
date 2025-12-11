import { firestore, storage } from "@/firebase/clientApp";
import { Post } from "@/types/post";
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

/**
 * Creates a new post document and uploads an optional image.
 * Captures creator identity from the Firebase user and seeds counters.
 * @param user - Auth user creating the post.
 * @param communityId - Target community id.
 * @param communityImageURL - Current community icon for feed cards.
 * @param postData - Post title and body text.
 * @param selectedFile - Optional base64 image data to upload.
 * @returns Created post id.
 * @see https://firebase.google.com/docs/firestore/manage-data/add-data
 */
export const createPost = async (
  user: User,
  communityId: string,
  communityImageURL: string | undefined,
  postData: { title: string; body: string },
  selectedFile?: string
) => {
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

  const postDocRef = await addDoc(collection(firestore, "posts"), newPost);

  if (selectedFile) {
    const imageRef = ref(storage, `posts/${postDocRef.id}/image`);
    await uploadString(imageRef, selectedFile, "data_url");
    const downloadURL = await getDownloadURL(imageRef);

    await updateDoc(doc(firestore, "posts", postDocRef.id), {
      imageURL: downloadURL,
    });
  }
  return postDocRef.id;
};
