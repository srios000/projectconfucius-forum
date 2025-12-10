import { Timestamp } from "firebase/firestore";

/**
 * Comment document for a post, including optional parent for threaded replies.
 */
export type Comment = {
  id: string;
  creatorId: string;
  creatorDisplayText: string;
  communityId: string;
  postId: string;
  postTitle: string;
  text: string;
  createdAt: Timestamp;
  parentId?: string;
  depth: number;
};
