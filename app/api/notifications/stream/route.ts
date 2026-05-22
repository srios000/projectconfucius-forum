import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { channelFor, notificationBus } from "@/lib/notifications/bus";

// Hold a long-lived response open and push events as they arrive.
// Vercel Fluid Compute supports long requests; cap at 800s and let the
// client EventSource auto-reconnect.
export const maxDuration = 800;

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

    const u = session.user as typeof session.user & { username?: string | null; image?: string | null };
    const local = await provisionLocalUser({
        authUserId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
        username: u.username ?? null,
        image: u.image ?? null,
    });
    const userId = local.id;
    const channel = channelFor(userId);

    const stream = new ReadableStream({
        start(controller) {
            const enc = new TextEncoder();
            let cursor = new Date();
            let closed = false;

            const send = (event: string, data: unknown) => {
                if (closed) return;
                try {
                    controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                } catch { /* connection closed */ }
            };

            send("ready", { userId });

            const flushNew = async () => {
                if (closed) return;
                try {
                    const rows = await db
                        .select()
                        .from(notifications)
                        .where(and(eq(notifications.userId, userId), gt(notifications.createdAt, cursor)));
                    for (const r of rows) {
                        send("notification", r);
                        if (r.createdAt > cursor) cursor = r.createdAt;
                    }
                } catch (err) {
                    console.error("[notifications/stream] flush failed", err);
                }
            };

            const onBus = () => { void flushNew(); };
            notificationBus.on(channel, onBus);

            // Safety-net poll for cross-instance deploys (in-process bus only
            // reaches the same Node process).
            const poll = setInterval(flushNew, 10_000);
            // Heartbeat to keep proxies from idling the connection.
            const heartbeat = setInterval(() => send("ping", { t: Date.now() }), 25_000);

            const cleanup = () => {
                if (closed) return;
                closed = true;
                clearInterval(poll);
                clearInterval(heartbeat);
                notificationBus.off(channel, onBus);
                try { controller.close(); } catch { /* already closed */ }
            };

            req.signal.addEventListener("abort", cleanup);
        },
    });

    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
            "x-accel-buffering": "no",
        },
    });
}
