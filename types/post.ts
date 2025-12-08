import { Timestamp } from "firebase/firestore";

/**
 * Shape of a post document stored in Firestore and consumed by the UI.
 * Represents the core content, metadata, and optional image for a community post.
 */
export type Post = {
  id?: string;
  communityId: string;
  creatorId: string;
  creatorUsername: string;
  title: string;
  body: string;
  numberOfComments: number;
  voteStatus: number;
  imageURL?: string;
  communityImageURL?: string;
  createTime: Timestamp;
};

/**
 * Represents a user's vote record on a post for syncing client and server state.
 * Stored per user to track whether they upvoted or downvoted a given post.
 */
export type PostVote = {
  id: string;
  postId: string;
  communityId: string;
  voteValue: number;
};
