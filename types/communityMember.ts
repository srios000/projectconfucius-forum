/**
 * Represents a user returned when listing community members or admins.
 * Derived from `users/{uid}` docs plus membership snippet existence.
 */
export type CommunityMember = {
  uid: string;
  email: string;
  displayName: string | null;
};
