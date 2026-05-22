/**
 * Shape of a post record consumed by the UI.
 * Captures feed fields, vote totals, and optional image metadata.
 */
export type Post = {
  id?: string;
  communityId: string | null;
  wallUserId?: string | null;
  creatorId: string;
  creatorUsername: string | null;
  title: string;
  body: string;
  numberOfComments: number;
  voteStatus: number;
  imageUrl?: string;
  communityImageUrl?: string;
  createdAt: Date;
  editedAt?: Date | null;
  editedById?: string | null;
  editedByRole?: string | null;
};

/**
 * Represents a user's vote record on a post for syncing client and server state.
 * Mirrors the aggregate `voteStatus` on the post.
 */
export type PostVote = {
  id: string;
  postId: string;
  communityId: string | null;
  voteValue: number;
};
