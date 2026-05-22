import { atom } from "jotai";
import { getNotificationsAction } from "@/app/actions/notifications";

export type Notification = Awaited<ReturnType<typeof getNotificationsAction>>[number];

// Source of truth for the in-app inbox. The EventSource lives inside this
// atom's onMount lifecycle — Jotai opens it when the first subscriber mounts
// and closes it when the last one unmounts, so no React useEffect is needed
// in the consumer hook.
export const notificationsAtom = atom<Notification[]>([]);

notificationsAtom.onMount = (set) => {
    let alive = true;

    void getNotificationsAction(false).then((rows) => {
        if (!alive) return;
        // Merge to avoid clobbering any SSE event that arrived first.
        set((prev) => {
            const seen = new Set(prev.map((n) => n.id));
            const fresh = rows.filter((r) => !seen.has(r.id));
            return [...prev, ...fresh].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        });
    });

    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("notification", (ev) => {
        try {
            const data = JSON.parse((ev as MessageEvent).data) as Notification;
            set((prev) => (prev.find((n) => n.id === data.id) ? prev : [data, ...prev]));
        } catch (err) {
            console.error("[notificationsAtom] parse failed", err);
        }
    });
    // EventSource auto-reconnects on error with exponential backoff; nothing else to wire.

    return () => {
        alive = false;
        es.close();
    };
};

export const unreadCountAtom = atom(
    (get) => get(notificationsAtom).filter((n) => !n.readAt).length,
);
