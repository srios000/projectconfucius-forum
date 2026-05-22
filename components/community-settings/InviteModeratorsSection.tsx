"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    inviteModeratorAction,
    listInvitationsForCommunityAction,
    revokeInvitationAction,
} from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { communityId: string };

const listKey = (cid: string) => ["community", "invitations", cid] as const;

export default function InviteModeratorsSection({ communityId }: Props) {
    const qc = useQueryClient();
    const [username, setUsername] = useState("");

    const invitations = useQuery({
        queryKey: listKey(communityId),
        queryFn: () => listInvitationsForCommunityAction(communityId),
    });

    const invite = useMutation({
        mutationFn: () => inviteModeratorAction(communityId, username.trim()),
        onSuccess: () => {
            toast.success(`Invited u/${username.trim()}`);
            setUsername("");
            qc.invalidateQueries({ queryKey: listKey(communityId) });
        },
        onError: (e) => toast.error("Invite failed", { description: e instanceof Error ? e.message : "" }),
    });

    const revoke = useMutation({
        mutationFn: (id: string) => revokeInvitationAction(id),
        onSuccess: () => {
            toast("Invitation revoked");
            qc.invalidateQueries({ queryKey: listKey(communityId) });
        },
    });

    const pending = (invitations.data ?? []).filter((i) => i.status === "pending");
    const history = (invitations.data ?? []).filter((i) => i.status !== "pending");

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Invite Moderators
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                    Send an invite to a user who hasn&apos;t joined yet. They&apos;ll see it in their notifications.
                    Once accepted, promote them from /members.
                </p>
            </div>
            <div className="flex gap-2">
                <Input
                    placeholder="Username to invite"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Button
                    onClick={() => invite.mutate()}
                    disabled={!username.trim() || invite.isPending}
                >
                    {invite.isPending ? "Sending…" : "Invite"}
                </Button>
            </div>

            {pending.length > 0 && (
                <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                    {pending.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 text-xs">
                            <div className="min-w-0">
                                <div className="font-semibold truncate">u/{inv.invitedUsername ?? "unknown"}</div>
                                <div className="text-[10.5px] text-muted-foreground">
                                    Pending · sent {new Date(inv.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => revoke.mutate(inv.id)}
                                disabled={revoke.isPending}
                            >
                                Revoke
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {history.length > 0 && (
                <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Past invitations ({history.length})</summary>
                    <ul className="mt-2 space-y-1">
                        {history.map((inv) => (
                            <li key={inv.id} className="text-[11px] text-muted-foreground">
                                u/{inv.invitedUsername ?? "unknown"} — {inv.status}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
