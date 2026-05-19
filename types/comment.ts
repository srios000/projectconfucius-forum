/**
 * Comment record for a post, including optional parent for threaded replies.
 * `depth` is used to limit nesting.
 */
export type Comment = {
  id: string;
  creatorId: string;
  creatorDisplayText: string;
  communityId: string;
  postId: string;
  postTitle: string;
  text: string;
  createdAt: Date;
  parentId?: string;
  depth: number;
};
