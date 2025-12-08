/**
 * Represents a user returned when listing community members or admins.
 */
export type CommunityMember = {
  uid: string;
  email: string;
  displayName: string | null;
};
