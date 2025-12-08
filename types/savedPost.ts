/**
 * Minimal saved post entry stored under a user's document for quick retrieval.
 */
export type SavedPost = {
  id: string;
  postId: string;
  communityId: string;
  postTitle: string;
  communityImageURL?: string;
};
