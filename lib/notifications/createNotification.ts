import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { publishNotification } from "./bus";

export type NewNotification = {
    userId: string;
    kind: string;
    title: string;
    body?: string | null;
    href?: string | null;
    payload?: Record<string, unknown> | null;
};

export async function createNotification(input: NewNotification) {
    const [row] = await db
        .insert(notifications)
        .values({
            id: randomUUID(),
            userId: input.userId,
            kind: input.kind,
            title: input.title,
            body: input.body ?? null,
            href: input.href ?? null,
            payload: input.payload ?? null,
        })
        .returning();
    publishNotification(input.userId);
    return row;
}
