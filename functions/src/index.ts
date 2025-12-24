import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Automatically creates a corresponding Firestore document when a new user registers via Firebase Auth.
 * Synchronizes essential profile data to the `users` collection for efficient client-side access.
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
 * Removes the user's Firestore document when their Firebase Auth account is deleted.
 * Ensures that no orphaned profile data remains in the database.
 */
export const deleteUserDocument = functions.auth
  .user()
  .onDelete(async (user) => {
    db.collection("users").doc(user.uid).delete();
  });

/**
 * A Firestore trigger that cleans up all user-saved references to a post when that post is deleted.
 * Uses a collection group query to find and remove the post from all users' `savedPosts` subcollections.
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
