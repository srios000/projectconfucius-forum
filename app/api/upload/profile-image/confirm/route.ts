import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    deleteForumObject,
    forumObjectExists,
    getForumPublicUrl,
    parseForumObjectKey,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const local = await provisionLocalUser({
        authUserId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
    });

    const body = (await req.json()) as { key?: string };
    const key = body.key ?? "";
    if (!key.startsWith(`users/${local.id}/`)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!(await forumObjectExists(key))) {
        return NextResponse.json({ message: "File not found in storage" }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
        where: eq(users.id, local.id),
        columns: { imageUrl: true },
    });
    const newUrl = getForumPublicUrl(key);
    await db.update(users).set({ imageUrl: newUrl, updatedAt: new Date() }).where(eq(users.id, local.id));

    const oldKey = parseForumObjectKey(existing?.imageUrl);
    if (oldKey && oldKey !== key) {
        deleteForumObject(oldKey).catch((err) => {
            console.error("[profile-image/confirm] best-effort delete failed", err);
        });
    }

    return NextResponse.json({ imageUrl: newUrl });
}