/**
 * The authenticated user shape exposed by the Better Auth client session.
 * Replaces the Firebase `User` type across the UI.
 */
export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};
