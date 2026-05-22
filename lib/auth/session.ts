import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";

export const getAppSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});

export const requireUser = cache(async () => {
    const session = await getAppSession();
    if (!session?.user) redirect("/api/auth/start");
    const u = session.user as typeof session.user & { username?: string | null; image?: string | null };
    const local = await provisionLocalUser({
        authUserId: u.id,
        email: u.email,
        name: u.name ?? u.email,
        username: u.username ?? null,
        image: u.image ?? null,
    });
    return { session, userId: local.id, user: local };
});