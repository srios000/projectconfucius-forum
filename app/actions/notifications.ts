"use server";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function getNotificationsAction(unreadOnly = false) {
    const { userId } = await requireUser();
    const where = unreadOnly
        ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
        : eq(notifications.userId, userId);
    const rows = await db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    return rows;
}

export async function markNotificationReadAction(id: string) {
    const { userId } = await requireUser();
    await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return { ok: true };
}

export async function markAllNotificationsReadAction() {
    const { userId } = await requireUser();
    await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { ok: true };
}
