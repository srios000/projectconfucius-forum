/**
 * Represents a user returned when listing community members or moderators.
 */
export type CommunityMember = {
  id: string;
  email: string;
  displayName: string | null;
};
