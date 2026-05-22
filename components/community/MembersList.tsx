"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useCommunityMembersListQuery } from "@/lib/queries/community/use-community-members-list";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useRemoveCommunityMember from "@/hooks/community/useRemoveCommunityMember";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LuTrash } from "react-icons/lu";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";

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
  const { removeMember, loading: removeLoading } = useRemoveCommunityMember();
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember(communityId, memberToRemove);
      toast.success("Member Removed", {
        description: "The user has been removed from this community.",
      });
    } catch (err) {
      toast.error("Error", {
        description: "Failed to remove user from this community.",
      });
    } finally {
      setMemberToRemove(null);
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
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3.5">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-foreground">
                    {member.displayName?.trim() ? member.displayName : "No Name"}
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setMemberToRemove(member.id)}
                    aria-label="Remove member"
                  >
                    <LuTrash className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        body="Are you sure you want to remove this member from the community?"
        confirmButtonText="Remove Member"
        isLoading={removeLoading}
      />
    </div>
  );
}
