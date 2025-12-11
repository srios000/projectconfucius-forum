/**
 * Represents a user eligible for admin roles within a community.
 * Pulled from `users/{uid}` when searching or listing community admins.
 */
export type AdminUser = {
  uid: string;
  email: string;
  displayName?: string;
};
