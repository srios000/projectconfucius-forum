/**
 * Minimal saved post entry for quick retrieval; powers the saved posts modal.
 */
export type SavedPost = {
  id: string;
  postId: string;
  communityId: string;
  postTitle: string;
  communityImageUrl?: string;
};
