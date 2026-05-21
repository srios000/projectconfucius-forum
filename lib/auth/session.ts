import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";

export const getAppSession = cache(async () => {
    return auth.api.getSession({ headers: await headers() });
});

/** Server-side: require an authenticated user, ensure a local row exists. */
export const requireUser = cache(async () => {
    const session = await getAppSession();
    if (!session?.user) redirect("/api/auth/start");
    const local = await provisionLocalUser({
        authUserId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
    });
    return { session, userId: local.id };
});