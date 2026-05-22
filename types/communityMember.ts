/**
 * Represents a user returned when listing community members or moderators.
 */
export type CommunityMember = {
  id: string;
  displayName: string | null;
  imageUrl: string | null;
};
