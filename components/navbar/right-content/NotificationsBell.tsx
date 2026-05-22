"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import moment from "moment";
import { useState } from "react";
import { toast } from "sonner";
import useNotifications from "@/hooks/notifications/useNotifications";
import type { Notification as Notif } from "@/atoms/notificationsAtom";
import {
    markAllNotificationsReadAction,
    markNotificationReadAction,
} from "@/app/actions/notifications";
import {
    acceptInvitationAction,
    declineInvitationAction,
} from "@/app/actions/invitations";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function NotificationsBell() {
    const { data: notifs, unreadCount, setData } = useNotifications();
    const [open, setOpen] = useState(false);

    const markRead = async (id: string) => {
        // Optimistic: stamp readAt locally, then persist.
        const now = new Date();
        setData((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: now } : n)));
        await markNotificationReadAction(id);
    };

    const markAllRead = async () => {
        const now = new Date();
        setData((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
        await markAllNotificationsReadAction();
    };

    const onAccept = async (n: Notif) => {
        const invId = (n.payload as { invitationId?: string } | null)?.invitationId;
        if (!invId) return;
        try {
            await acceptInvitationAction(invId);
            await markRead(n.id);
            toast.success("Invitation accepted");
        } catch (e) {
            toast.error("Failed", { description: e instanceof Error ? e.message : "" });
        }
    };

    const onDecline = async (n: Notif) => {
        const invId = (n.payload as { invitationId?: string } | null)?.invitationId;
        if (!invId) return;
        try {
            await declineInvitationAction(invId);
            await markRead(n.id);
            toast("Declined");
        } catch (e) {
            toast.error("Failed", { description: e instanceof Error ? e.message : "" });
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-semibold">Notifications</span>
                    <button
                        type="button"
                        className="text-[10.5px] text-primary hover:underline cursor-pointer border-0 bg-transparent"
                        onClick={markAllRead}
                    >
                        Mark all read
                    </button>
                </div>
                {(notifs?.length ?? 0) === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div>
                ) : (
                    notifs!.map((n) => {
                        const isInvite = n.kind === "mod_invite";
                        const unread = !n.readAt;
                        return (
                            <div
                                key={n.id}
                                className={
                                    "px-3 py-2.5 border-b border-border/60 last:border-b-0 " +
                                    (unread ? "bg-primary-mute/30" : "")
                                }
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <Link
                                        href={n.href ?? "#"}
                                        onClick={() => { if (unread) void markRead(n.id); setOpen(false); }}
                                        className="flex-1 min-w-0"
                                    >
                                        <div className="text-[12px] font-semibold text-foreground truncate">{n.title}</div>
                                        {n.body && (
                                            <div className="text-[11px] text-muted-foreground line-clamp-2">{n.body}</div>
                                        )}
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            {moment(n.createdAt).fromNow()}
                                        </div>
                                    </Link>
                                    {unread && !isInvite && (
                                        <button
                                            type="button"
                                            onClick={() => markRead(n.id)}
                                            aria-label="Mark read"
                                            className="text-muted-foreground hover:text-primary p-1 rounded cursor-pointer border-0 bg-transparent"
                                        >
                                            <Check className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                {isInvite && unread && (
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm" onClick={() => onAccept(n)}>Accept</Button>
                                        <Button size="sm" variant="outline" onClick={() => onDecline(n)}>Decline</Button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
