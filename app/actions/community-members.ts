"use server";

import { requireUser } from "@/lib/auth/session";
import { getActorContext, isCommunityModerator, isCommunityOwner } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

async function loadMembership(userId: string, communityId: string) {
  return db.query.communityMembers.findFirst({
    where: and(eq(communityMembers.userId, userId), eq(communityMembers.communityId, communityId)),
    columns: { userId: true, isModerator: true, bannedAt: true },
  });
}

export async function promoteMemberAction(communityId: string, targetUserId: string) {
  const { userId } = await requireUser();
  const { superadmin } = await getActorContext();
  const isOwner = await isCommunityOwner(userId, communityId);
  if (!isOwner && !superadmin) throw new Error("Forbidden");

  await db
    .update(communityMembers)
    .set({ isModerator: true })
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
  return { ok: true };
}

export async function demoteMemberAction(communityId: string, targetUserId: string) {
  const { userId } = await requireUser();
  const { superadmin } = await getActorContext();
  const isOwner = await isCommunityOwner(userId, communityId);
  if (!isOwner && !superadmin) throw new Error("Forbidden");

  // Owner cannot be demoted via this action.
  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { creatorId: true },
  });
  if (community?.creatorId === targetUserId) throw new Error("Cannot demote the community owner");

  await db
    .update(communityMembers)
    .set({ isModerator: false })
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
  return { ok: true };
}

export async function kickMemberAction(communityId: string, targetUserId: string) {
  const { userId } = await requireUser();
  const { superadmin } = await getActorContext();

  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { creatorId: true },
  });
  if (community?.creatorId === targetUserId) throw new Error("Cannot kick the community owner");

  const isOwner = community?.creatorId === userId;
  const actorIsMod = await isCommunityModerator(userId, communityId);
  const target = await loadMembership(targetUserId, communityId);

  // Mods can kick non-mods. Only owner/superadmin can kick a mod.
  if (target?.isModerator && !isOwner && !superadmin) throw new Error("Only the owner can remove a moderator");
  if (!actorIsMod && !isOwner && !superadmin) throw new Error("Forbidden");

  await db.transaction(async (tx) => {
    await tx
      .delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
    await tx
      .update(communities)
      .set({ numberOfMembers: sql`GREATEST(${communities.numberOfMembers} - 1, 0)` })
      .where(eq(communities.id, communityId));
  });
  return { ok: true };
}

export async function banMemberAction(communityId: string, targetUserId: string) {
  const { userId } = await requireUser();
  const { superadmin } = await getActorContext();

  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    columns: { creatorId: true },
  });
  if (community?.creatorId === targetUserId) throw new Error("Cannot ban the community owner");

  const isOwner = community?.creatorId === userId;
  const actorIsMod = await isCommunityModerator(userId, communityId);
  const target = await loadMembership(targetUserId, communityId);
  if (target?.isModerator && !isOwner && !superadmin) throw new Error("Only the owner can ban a moderator");
  if (!actorIsMod && !isOwner && !superadmin) throw new Error("Forbidden");

  // Keep the row but flag banned (prevents rejoin via joinCommunity check).
  await db.transaction(async (tx) => {
    const existing = target;
    if (existing) {
      await tx
        .update(communityMembers)
        .set({ bannedAt: new Date(), bannedById: userId, isModerator: false })
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
      await tx
        .update(communities)
        .set({ numberOfMembers: sql`GREATEST(${communities.numberOfMembers} - 1, 0)` })
        .where(eq(communities.id, communityId));
    } else {
      // Insert a tombstone so rejoin is blocked.
      await tx.insert(communityMembers).values({
        userId: targetUserId,
        communityId,
        isModerator: false,
        bannedAt: new Date(),
        bannedById: userId,
      });
    }
  });
  return { ok: true };
}

export async function unbanMemberAction(communityId: string, targetUserId: string) {
  const { userId } = await requireUser();
  const { superadmin } = await getActorContext();
  const isOwner = await isCommunityOwner(userId, communityId);
  const actorIsMod = await isCommunityModerator(userId, communityId);
  if (!isOwner && !actorIsMod && !superadmin) throw new Error("Forbidden");

  // Removing the tombstone row is the cleanest unban; they may rejoin freely.
  await db
    .delete(communityMembers)
    .where(and(
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.userId, targetUserId),
      sql`${communityMembers.bannedAt} IS NOT NULL`,
    ));
  return { ok: true };
}
