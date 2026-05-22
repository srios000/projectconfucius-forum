"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useCommunityMembersListQuery } from "@/lib/queries/community/use-community-members-list";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useCurrentRole from "@/hooks/useCurrentRole";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, ShieldPlus, ShieldOff, UserMinus, Ban, Undo2 } from "lucide-react";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usePromoteMemberMutation,
  useDemoteMemberMutation,
  useKickMemberMutation,
  useBanMemberMutation,
  useUnbanMemberMutation,
} from "@/lib/queries/community/use-member-actions";

type MembersListProps = {
  communityId: string;
};

export default function MembersList({ communityId }: MembersListProps) {
  const membersQuery = useCommunityMembersListQuery({
    communityId,
    enabled: true,
  });
  const members = membersQuery.data ?? [];
  const loading = membersQuery.isLoading;
  const error = membersQuery.error;
  const memberCount = members?.length ?? 0;

  const { data: communityDataForPerms, isLoading: communityLoading } = useCommunityDataQuery({
    communityId,
  });
  const { isAdmin } = useCommunityPermissions(communityDataForPerms ?? undefined);
  const { userId: currentUserId, isSuperadmin } = useCurrentRole();
  const isOwner = !!currentUserId && communityDataForPerms?.creatorId === currentUserId;
  const promote = usePromoteMemberMutation();
  const demote = useDemoteMemberMutation();
  const kick = useKickMemberMutation();
  const ban = useBanMemberMutation();
  const unban = useUnbanMemberMutation();
  const [pendingAction, setPendingAction] = useState<
    | { kind: "kick" | "ban" | "demote"; userId: string; label: string }
    | null
  >(null);
  const busy = promote.isPending || demote.isPending || kick.isPending || ban.isPending || unban.isPending;

  const runConfirm = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.kind === "kick") await kick.mutateAsync({ communityId, targetUserId: pendingAction.userId });
      if (pendingAction.kind === "ban") await ban.mutateAsync({ communityId, targetUserId: pendingAction.userId });
      if (pendingAction.kind === "demote") await demote.mutateAsync({ communityId, targetUserId: pendingAction.userId });
      toast.success(`${pendingAction.label} done`);
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setPendingAction(null);
    }
  };

  if (loading || communityLoading) {
    return (
      <div className="space-y-4 max-w-190 mx-auto px-3 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-190 px-3 py-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
          {memberCount} Community Member{memberCount === 1 ? "" : "s"}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Registered members of c/{communityId}.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {error ? "Failed to load subscribers." : "No subscribers found."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
            {members.map((member) => {
              const initials = (member.displayName ?? "?")
                .split(/\s+/)
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
              <div key={member.id} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-9 shrink-0">
                    {member.imageUrl && <AvatarImage src={member.imageUrl} alt="" />}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">
                      {member.displayName?.trim() ? member.displayName : "No Name"}
                    </div>
                    {member.isModerator && (
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-mute text-primary">
                        MOD
                      </span>
                    )}
                    {member.bannedAt && (
                      <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                        BANNED
                      </span>
                    )}
                  </div>
                </div>

                {isAdmin && member.id !== currentUserId && member.id !== communityDataForPerms?.creatorId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Member actions" disabled={busy}>
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      {(isOwner || isSuperadmin) && !member.isModerator && !member.bannedAt && (
                        <DropdownMenuItem onClick={() => promote.mutateAsync({ communityId, targetUserId: member.id }).then(() => toast.success("Promoted to mod"))}>
                          <ShieldPlus className="size-3.5 mr-1.5" /> Promote to mod
                        </DropdownMenuItem>
                      )}
                      {(isOwner || isSuperadmin) && member.isModerator && (
                        <DropdownMenuItem onClick={() => setPendingAction({ kind: "demote", userId: member.id, label: "Demoted" })}>
                          <ShieldOff className="size-3.5 mr-1.5" /> Demote
                        </DropdownMenuItem>
                      )}
                      {!member.bannedAt && (
                        <DropdownMenuItem onClick={() => setPendingAction({ kind: "kick", userId: member.id, label: "Kicked" })}>
                          <UserMinus className="size-3.5 mr-1.5" /> Kick
                        </DropdownMenuItem>
                      )}
                      {!member.bannedAt ? (
                        <DropdownMenuItem
                          onClick={() => setPendingAction({ kind: "ban", userId: member.id, label: "Banned" })}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="size-3.5 mr-1.5" /> Ban
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => unban.mutateAsync({ communityId, targetUserId: member.id }).then(() => toast.success("Unbanned"))}>
                          <Undo2 className="size-3.5 mr-1.5" /> Unban
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={runConfirm}
        title={
          pendingAction?.kind === "ban"
            ? "Ban this member?"
            : pendingAction?.kind === "kick"
              ? "Kick this member?"
              : "Demote this moderator?"
        }
        body={
          pendingAction?.kind === "ban"
            ? "They will be removed and prevented from rejoining until unbanned."
            : pendingAction?.kind === "kick"
              ? "They will be removed but can rejoin the community."
              : "They will lose moderator privileges."
        }
        confirmButtonText={
          pendingAction?.kind === "ban" ? "Ban" : pendingAction?.kind === "kick" ? "Kick" : "Demote"
        }
        isLoading={busy}
      />
    </div>
  );
}
