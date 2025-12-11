/**
 * Minimal saved post entry stored under a user's document for quick retrieval.
 * Lives at `users/{uid}/savedPosts/{postId}` and powers the saved posts modal.
 */
export type SavedPost = {
  id: string;
  postId: string;
  communityId: string;
  postTitle: string;
  communityImageURL?: string;
};
