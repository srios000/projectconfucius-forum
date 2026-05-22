"use server";

import { requireUser } from "@/lib/auth/session";
import { resolvePostActor } from "@/lib/auth/permissions";
import { handlePostVote } from "@/lib/posts/handlePostVote";
import { createPost } from "@/lib/posts/createPost";
import { deletePost } from "@/lib/posts/deletePost";
import { db } from "@/lib/db";
import { posts, communityMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
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
  communityId: string | null
) {
  const { userId } = await requireUser();
  return handlePostVote(userId, post, vote, communityId);
}

type CreatePostTargetInput =
  | { kind: "community"; communityId: string; communityImageUrl?: string }
  | { kind: "wall"; wallUserId: string };

export async function createPostAction(
  target: CreatePostTargetInput,
  postData: { title: string; body: string },
  imageUrl?: string
) {
  const { user } = await requireUser();
  return createPost(
    { id: user.id, username: user.username ?? null },
    target,
    postData,
    imageUrl
  );
}

export async function deletePostAction(postId: string) {
  const { userId } = await requireUser();
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: { creatorId: true, communityId: true },
  });
  if (!post) throw new Error("Post not found");
  const isCreator = post.creatorId === userId;
  let isModerator = false;
  if (!isCreator && post.communityId) {
    const mem = await db.query.communityMembers.findFirst({
      where: and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, post.communityId),
      ),
      columns: { isModerator: true },
    });
    isModerator = !!mem?.isModerator;
  }
  if (!isCreator && !isModerator) throw new Error("Forbidden");
  return deletePost(postId);
}

export async function editPostAction(
  postId: string,
  data: { title?: string; body?: string },
) {
  const actor = await resolvePostActor(postId);
  if (!actor.role) throw new Error("Forbidden");
  const patch: Record<string, unknown> = {
    editedAt: new Date(),
    editedById: actor.userId,
    editedByRole: actor.role,
  };
  if (typeof data.title === "string") {
    const t = data.title.trim();
    if (!t) throw new Error("Title required");
    patch.title = t;
  }
  if (typeof data.body === "string") patch.body = data.body;
  const [updated] = await db.update(posts).set(patch).where(eq(posts.id, postId)).returning();
  return updated;
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
