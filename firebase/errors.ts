/**
 * A mapping of technical Firebase Auth error codes to user-friendly error messages.
 * Used to provide clear feedback during sign-up and sign-in processes.
 */
export const FIREBASE_ERRORS = {
  // Sign Up Errors
  "auth/email-already-in-use": "Email already in use.",
  "auth/account-exists-with-different-credential": "Email already in use.",

  // Sign In Errors
  "auth/user-not-found": "Invalid email or password",
  "auth/wrong-password": "Invalid email or password",
  "auth/invalid-credential": "Invalid email or password",
};
