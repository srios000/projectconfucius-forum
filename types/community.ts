/**
 * Community record used to render pages and determine permissions.
 * Tracks ownership, privacy, member count, and optional branding.
 */
export interface Community {
  id: string;
  creatorId: string;
  numberOfMembers: number;
  privacyType: "public" | "restricted" | "private";
  createdAt: Date;
  imageUrl?: string;
}

/**
 * Lightweight user-scoped record that links a user to a community.
 * Used for menus and permission checks.
 */
export interface CommunitySnippet {
  communityId: string;
  isModerator?: boolean;
  imageUrl?: string;
}
