import { db } from "@/lib/db";
import { communityMembers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/** Returns true iff the user is a moderator of the given community. */
export async function isModerator(userId: string, communityId: string): Promise<boolean> {
    const row = await db.query.communityMembers.findFirst({
        where: and(
            eq(communityMembers.userId, userId),
            eq(communityMembers.communityId, communityId),
        ),
        columns: { isModerator: true },
    });
    return !!row?.isModerator;
}