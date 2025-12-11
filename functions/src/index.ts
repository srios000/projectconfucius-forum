import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Creates a user document in Firestore when a new user account is created in Firebase Authentication.
 * Mirrors auth profile fields into `users/{uid}` to keep client bootstrap fast.
 * @returns Resolves after the write completes.
 * @see https://firebase.google.com/docs/functions/auth-events
 */
export const createUserDocument = functions.auth
  .user()
  .onCreate(async (user) => {
    db.collection("users")
      .doc(user.uid)
      .set(JSON.parse(JSON.stringify(user)));
  });

//! In case the above does not work
// export const createUserDocument = functions.auth
//   .user()
//   .onCreate(async (user) => {
//     const newUser = {
//       uid: user.uid,
//       email: user.email,
//       displayName: user.displayName,
//       providerData: user.providerData,
//     };
//     db.collection("users").doc(user.uid).set(newUser);
//   });

/**
 * Deletes the user document in Firestore when a user account is deleted in Firebase Authentication.
 * Keeps dangling profile documents from persisting after account removal.
 * @returns Resolves after the document is deleted.
 */
export const deleteUserDocument = functions.auth
  .user()
  .onDelete(async (user) => {
    db.collection("users").doc(user.uid).delete();
  });

/**
 * Deletes saved post references when a post is removed.
 * Cleans up `savedPosts` subcollections across all users to prevent broken links.
 * @returns Resolves after the batch delete finishes.
 */
export const deleteSavedPost = functions.firestore
  .document("posts/{postId}")
  .onDelete(async (snap, context) => {
    const postId = context.params.postId;
    const savedPostsSnapshot = await db
      .collectionGroup("savedPosts")
      .where("postId", "==", postId)
      .get();

    const batch = db.batch();
    savedPostsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  });
