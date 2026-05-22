import { EventEmitter } from "events";

// In-process pub/sub for SSE fanout. Works for single-instance deployments;
// the SSE handler also polls the DB periodically so cross-instance deploys
// still see notifications (just with poll-interval latency).
class NotificationBus extends EventEmitter {}

const globalForBus = globalThis as unknown as { __notificationBus?: NotificationBus };
export const notificationBus: NotificationBus =
    globalForBus.__notificationBus ?? new NotificationBus();
globalForBus.__notificationBus = notificationBus;

notificationBus.setMaxListeners(0);

export function channelFor(userId: string): string {
    return `user:${userId}`;
}

export function publishNotification(userId: string) {
    notificationBus.emit(channelFor(userId));
}
