"use server";

import { requireUser } from "@/lib/auth/session";
import { handlePostVote } from "@/lib/posts/handlePostVote";
import { createPost } from "@/lib/posts/createPost";
import { deletePost } from "@/lib/posts/deletePost";
import { getPostVotes } from "@/lib/posts/getPostVotes";
import { getCommunityPostVotes } from "@/lib/posts/getCommunityPostVotes";
import { getSavedPosts } from "@/lib/posts/getSavedPosts";
import { savePost } from "@/lib/posts/savePost";
import { unsavePost } from "@/lib/posts/unsavePost";
import type { Post, PostVote } from "@/types/post";
import type { SavedPost } from "@/types/savedPost";

export async function voteAction(
  post: Post,
  vote: number,
  communityId: string | null,
  existing?: PostVote
) {
  const { userId } = await requireUser();
  return handlePostVote(userId, post, vote, communityId, existing);
}

type CreatePostTargetInput =
  | { kind: "community"; communityId: string; communityImageUrl?: string }
  | { kind: "wall"; wallUserId: string };

export async function createPostAction(
  target: CreatePostTargetInput,
  postData: { title: string; body: string },
  imageUrl?: string
) {
  const { session, userId } = await requireUser();
  const u = session.user as typeof session.user & { username?: string | null };
  return createPost(
    { id: userId, username: u.username ?? null },
    target,
    postData,
    imageUrl
  );
}

export async function deletePostAction(postId: string) {
  await requireUser();
  return deletePost(postId);
}

export async function getPostVotesAction(postIds?: string[]) {
  const { userId } = await requireUser();
  return getPostVotes(userId, postIds);
}

export async function getCommunityPostVotesAction(communityId: string) {
  const { userId } = await requireUser();
  return getCommunityPostVotes(userId, communityId);
}

export async function getSavedPostsAction() {
  const { userId } = await requireUser();
  return getSavedPosts(userId);
}

export async function savePostAction(post: Post): Promise<SavedPost> {
  const { userId } = await requireUser();
  await savePost(userId, {
    id: post.id!,
    communityId: post.communityId,
    title: post.title,
    communityImageUrl: post.communityImageUrl,
  });
  return {
    id: post.id!,
    postId: post.id!,
    communityId: post.communityId ?? "",
    postTitle: post.title,
    communityImageUrl: post.communityImageUrl,
  };
}

export async function unsavePostAction(postId: string) {
  const { userId } = await requireUser();
  return unsavePost(userId, postId);
}
