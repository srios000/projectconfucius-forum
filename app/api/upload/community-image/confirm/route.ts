import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { isModerator } from "@/lib/auth/requireModerator";
import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
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

    const body = (await req.json()) as { key?: string; communityId?: string };
    const { key = "", communityId = "" } = body;
    if (!communityId || !key.startsWith(`communities/${communityId}/`)) {
        return NextResponse.json({ message: "Invalid key" }, { status: 400 });
    }

    const u = session.user as typeof session.user & { username?: string | null; image?: string | null };
    const local = await provisionLocalUser({
        authUserId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
        username: u.username ?? null,
        image: u.image ?? null,
    });
    if (!(await isModerator(local.id, communityId))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!(await forumObjectExists(key))) {
        return NextResponse.json({ message: "File not found in storage" }, { status: 400 });
    }

    const existing = await db.query.communities.findFirst({
        where: eq(communities.id, communityId),
        columns: { imageUrl: true },
    });
    const newUrl = getForumPublicUrl(key);
    await db.update(communities).set({ imageUrl: newUrl }).where(eq(communities.id, communityId));

    const oldKey = parseForumObjectKey(existing?.imageUrl);
    if (oldKey && oldKey !== key) {
        deleteForumObject(oldKey).catch((err) => {
            console.error("[community-image/confirm] best-effort delete failed", err);
        });
    }

    return NextResponse.json({ imageUrl: newUrl });
}