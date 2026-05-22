import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { randomUUID } from "crypto";

type CommunityTarget = {
  kind: "community";
  communityId: string;
  communityImageUrl?: string;
};

type WallTarget = {
  kind: "wall";
  wallUserId: string;
};

export type CreatePostTarget = CommunityTarget | WallTarget;

export const createPost = async (
  author: { id: string; username: string | null },
  target: CreatePostTarget,
  postData: { title: string; body: string },
  imageUrl?: string,
) => {
  const id = randomUUID();
  await db.insert(posts).values({
    id,
    communityId: target.kind === "community" ? target.communityId : null,
    wallUserId: target.kind === "wall" ? target.wallUserId : null,
    communityImageUrl: target.kind === "community" ? target.communityImageUrl ?? null : null,
    creatorId: author.id,
    creatorUsername: author.username,
    title: postData.title,
    body: postData.body,
    imageUrl: imageUrl ?? null,
    numberOfComments: 0,
    voteStatus: 0,
  });
  return id;
};