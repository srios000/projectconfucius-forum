"use server";

import { requireUser } from "@/lib/auth/session";
import { getActorContext, isCommunityOwner } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { communityInvitations, communityMembers, users, communities } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createNotification } from "@/lib/notifications/createNotification";

export async function inviteModeratorAction(communityId: string, targetUsername: string) {
    const { userId } = await requireUser();
    const { superadmin } = await getActorContext();
    if (!(await isCommunityOwner(userId, communityId)) && !superadmin) {
        throw new Error("Only the community owner can invite moderators");
    }

    const target = await db.query.users.findFirst({
        where: eq(users.username, targetUsername.trim()),
        columns: { id: true, name: true },
    });
    if (!target) throw new Error("User not found");
    if (target.id === userId) throw new Error("You're already the owner");

    // Block double-invite (unique pending index also enforces this).
    const existing = await db.query.communityInvitations.findFirst({
        where: and(
            eq(communityInvitations.communityId, communityId),
            eq(communityInvitations.invitedUserId, target.id),
            eq(communityInvitations.status, "pending"),
        ),
        columns: { id: true },
    });
    if (existing) throw new Error("Invitation already pending");

    const [row] = await db
        .insert(communityInvitations)
        .values({
            id: randomUUID(),
            communityId,
            invitedUserId: target.id,
            invitedById: userId,
            role: "moderator",
            status: "pending",
        })
        .returning();

    await createNotification({
        userId: target.id,
        kind: "mod_invite",
        title: `Moderator invite from c/${communityId}`,
        body: "Accept to join the community.",
        href: `/c/${communityId}`,
        payload: { invitationId: row.id, communityId },
    });

    return row;
}

export async function listInvitationsForCommunityAction(communityId: string) {
    const { userId } = await requireUser();
    const { superadmin } = await getActorContext();
    if (!(await isCommunityOwner(userId, communityId)) && !superadmin) {
        throw new Error("Forbidden");
    }
    const rows = await db
        .select({
            id: communityInvitations.id,
            status: communityInvitations.status,
            createdAt: communityInvitations.createdAt,
            respondedAt: communityInvitations.respondedAt,
            invitedUserId: communityInvitations.invitedUserId,
            invitedUsername: users.username,
            invitedName: users.name,
        })
        .from(communityInvitations)
        .innerJoin(users, eq(communityInvitations.invitedUserId, users.id))
        .where(eq(communityInvitations.communityId, communityId))
        .orderBy(desc(communityInvitations.createdAt))
        .limit(50);
    return rows;
}

export async function revokeInvitationAction(invitationId: string) {
    const { userId } = await requireUser();
    const { superadmin } = await getActorContext();

    const inv = await db.query.communityInvitations.findFirst({
        where: eq(communityInvitations.id, invitationId),
        columns: { id: true, communityId: true, status: true },
    });
    if (!inv) throw new Error("Invitation not found");
    if (!(await isCommunityOwner(userId, inv.communityId)) && !superadmin) {
        throw new Error("Forbidden");
    }
    if (inv.status !== "pending") throw new Error("Invitation is not pending");

    await db
        .update(communityInvitations)
        .set({ status: "revoked", respondedAt: new Date() })
        .where(eq(communityInvitations.id, invitationId));
    return { ok: true };
}

async function loadInviteForInvitee(invitationId: string, invitedUserId: string) {
    return db.query.communityInvitations.findFirst({
        where: and(
            eq(communityInvitations.id, invitationId),
            eq(communityInvitations.invitedUserId, invitedUserId),
        ),
        columns: { id: true, communityId: true, status: true, invitedById: true },
    });
}

export async function acceptInvitationAction(invitationId: string) {
    const { userId } = await requireUser();
    const inv = await loadInviteForInvitee(invitationId, userId);
    if (!inv) throw new Error("Invitation not found");
    if (inv.status !== "pending") throw new Error("Invitation already responded to");

    await db.transaction(async (tx) => {
        await tx
            .update(communityInvitations)
            .set({ status: "accepted", respondedAt: new Date() })
            .where(eq(communityInvitations.id, invitationId));

        // Ensure they're a member (mod promotion handled separately by owner
        // per product decision — accepting the invite only adds membership).
        const existing = await tx.query.communityMembers.findFirst({
            where: and(
                eq(communityMembers.userId, userId),
                eq(communityMembers.communityId, inv.communityId),
            ),
            columns: { userId: true },
        });
        if (!existing) {
            await tx.insert(communityMembers).values({
                userId,
                communityId: inv.communityId,
                isModerator: false,
            });
            await tx
                .update(communities)
                .set({ numberOfMembers: sql`${communities.numberOfMembers} + 1` })
                .where(eq(communities.id, inv.communityId));
        }
    });

    await createNotification({
        userId: inv.invitedById,
        kind: "mod_invite_accepted",
        title: "Moderator invite accepted",
        body: `u/${userId} joined c/${inv.communityId}. Promote them in /members.`,
        href: `/c/${inv.communityId}/members`,
        payload: { communityId: inv.communityId, newMemberId: userId },
    });

    return { ok: true };
}

export async function declineInvitationAction(invitationId: string) {
    const { userId } = await requireUser();
    const inv = await loadInviteForInvitee(invitationId, userId);
    if (!inv) throw new Error("Invitation not found");
    if (inv.status !== "pending") throw new Error("Invitation already responded to");

    await db
        .update(communityInvitations)
        .set({ status: "declined", respondedAt: new Date() })
        .where(eq(communityInvitations.id, invitationId));

    await createNotification({
        userId: inv.invitedById,
        kind: "mod_invite_declined",
        title: "Moderator invite declined",
        body: `Invite to c/${inv.communityId} was declined.`,
        href: `/c/${inv.communityId}`,
        payload: { communityId: inv.communityId },
    });

    return { ok: true };
}
