import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Find-or-relink-or-create the local users row for a Better Auth identity.
 * `authUserId` and `email` are both unique. If the authUserId lookup misses
 * but the email exists, relink that row (latest sign-in wins) instead of
 * creating a duplicate. See spec §2 / memory: dual-key provisioning.
 */
export async function provisionLocalUser(input: {
    authUserId: string;
    email: string;
    name: string;
}): Promise<{ id: string }> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email;

    const byAuth = await db.query.users.findFirst({
        where: eq(users.authUserId, input.authUserId),
        columns: { id: true },
    });
    if (byAuth) return { id: byAuth.id };

    const byEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true },
    });
    if (byEmail) {
        const [row] = await db.update(users)
            .set({ authUserId: input.authUserId, updatedAt: new Date() })
            .where(eq(users.id, byEmail.id))
            .returning({ id: users.id });
        return { id: row.id };
    }

    const [row] = await db.insert(users)
        .values({ id: randomUUID(), authUserId: input.authUserId, email, name })
        .returning({ id: users.id });
    return { id: row.id };
}