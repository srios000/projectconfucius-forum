import { db } from "@/lib/db";
import { communityMembers, posts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getAppSession, requireUser } from "@/lib/auth/session";

export type ActorRole = "author" | "moderator" | "superadmin";

const SUPERADMIN_ROLE = "forum-superadmin";

function rolesFromSession(session: Awaited<ReturnType<typeof getAppSession>>): string[] {
    const raw = (session?.user as { role?: unknown } | undefined)?.role;
    if (typeof raw !== "string" || !raw) return [];
    // better-auth admin plugin stores roles as a comma-separated string on `user.role`.
    return raw.split(",").map((r) => r.trim()).filter(Boolean);
}

export function isSuperadmin(roles: string[]): boolean {
    return roles.includes(SUPERADMIN_ROLE);
}

export async function getActorContext() {
    const session = await getAppSession();
    const roles = rolesFromSession(session);
    return { session, roles, superadmin: isSuperadmin(roles) };
}

export async function isCommunityModerator(userId: string, communityId: string): Promise<boolean> {
    const row = await db.query.communityMembers.findFirst({
        where: and(
            eq(communityMembers.userId, userId),
            eq(communityMembers.communityId, communityId),
        ),
        columns: { isModerator: true, bannedAt: true },
    });
    return !!row?.isModerator && !row.bannedAt;
}

export async function isCommunityOwner(userId: string, communityId: string): Promise<boolean> {
    const row = await db.query.communities.findFirst({
        where: (c, { eq: e }) => e(c.id, communityId),
        columns: { creatorId: true },
    });
    return row?.creatorId === userId;
}

export type PostEditContext = {
    isAuthor: boolean;
    isMod: boolean;
    isSuper: boolean;
    role: ActorRole | null;
};

export async function resolvePostActor(postId: string): Promise<PostEditContext & { userId: string; post: { creatorId: string; communityId: string | null } }> {
    const { userId } = await requireUser();
    const { superadmin } = await getActorContext();
    const post = await db.query.posts.findFirst({
        where: eq(posts.id, postId),
        columns: { creatorId: true, communityId: true },
    });
    if (!post) throw new Error("Post not found");
    const isAuthor = post.creatorId === userId;
    const isMod = !isAuthor && !!post.communityId && (await isCommunityModerator(userId, post.communityId));
    const role: ActorRole | null = isAuthor ? "author" : superadmin ? "superadmin" : isMod ? "moderator" : null;
    return { userId, post, isAuthor, isMod, isSuper: superadmin, role };
}
