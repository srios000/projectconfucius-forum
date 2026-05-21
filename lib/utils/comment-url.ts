export function buildCommentUrl(
  communityId: string,
  postId: string,
  commentId: string,
): string {
  if (!communityId || !postId || !commentId) {
    throw new Error("buildCommentUrl: empty segment");
  }
  return `/c/${encodeURIComponent(communityId)}/posts/${encodeURIComponent(postId)}/comment/${encodeURIComponent(commentId)}`;
}
