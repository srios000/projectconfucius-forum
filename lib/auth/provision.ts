import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Find-or-relink-or-create the local users row for a Better Auth identity.
 * Syncs username (drift-corrected) and image (only when local is null) from the
 * auth session. See spec §Provisioning.
 */
export async function provisionLocalUser(input: {
    authUserId: string;
    email: string;
    name: string;
    username: string | null;
    image: string | null;
}): Promise<{ id: string; username: string | null }> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email;

    const byAuth = await db.query.users.findFirst({
        where: eq(users.authUserId, input.authUserId),
        columns: { id: true, username: true, imageUrl: true },
    });
    if (byAuth) {
        const patch: Record<string, unknown> = {};
        if (input.username != null && byAuth.username !== input.username) patch.username = input.username;
        if (byAuth.imageUrl == null && input.image != null) patch.imageUrl = input.image;
        if (Object.keys(patch).length > 0) {
            patch.updatedAt = new Date();
            await db.update(users).set(patch).where(eq(users.id, byAuth.id));
        }
        return { id: byAuth.id, username: (patch.username as string | undefined) ?? byAuth.username };
    }

    const byEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, imageUrl: true },
    });
    if (byEmail) {
        const [row] = await db.update(users)
            .set({
                authUserId: input.authUserId,
                name,
                username: input.username,
                imageUrl: input.image,
                updatedAt: new Date(),
            })
            .where(eq(users.id, byEmail.id))
            .returning({ id: users.id, username: users.username });
        return { id: row.id, username: row.username };
    }

    const [row] = await db.insert(users)
        .values({
            id: randomUUID(),
            authUserId: input.authUserId,
            email,
            name,
            username: input.username,
            imageUrl: input.image,
        })
        .returning({ id: users.id, username: users.username });
    return { id: row.id, username: row.username };
}