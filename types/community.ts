import { Timestamp } from "firebase/firestore";

/**
 * Firestore community document used to render pages and determine permissions.
 * Tracks ownership, privacy, member count, and optional branding.
 */
export interface Community {
  id: string;
  creatorId: string;
  numberOfMembers: number;
  privacyType: "public" | "restricted" | "private";
  createdAt?: Timestamp;
  imageURL?: string;
  adminIds?: string[];
}

/**
 * Lightweight user-scoped record that links a user to a community.
 * Used for navigation menus, permissions, and quick access to membership info.
 */
export interface CommunitySnippet {
  communityId: string;
  isAdmin?: boolean;
  imageURL?: string;
}
