"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useDeleteCommunity from "@/hooks/community/useDeleteCommunity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";

type DangerProps = {
  communityId: string;
};

export default function Danger({ communityId }: DangerProps) {
  const { data: communityData, isLoading } = useCommunityDataQuery({ communityId });
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Hook receives communityData context
  const { deleteCommunity, loading } = useDeleteCommunity(communityData || ({} as any));

  if (isLoading || !communityData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteCommunity();
      // hook redirects to "/" and shows a success toast
    } catch (err) {
      // hook shows an error toast
    } finally {
      setDeleteConfirmationOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-destructive">Danger Zone</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Deleting a community is permanent. All posts, comments, and settings will be permanently erased.
        </p>
      </div>

      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl space-y-4">
        <p className="text-sm text-foreground font-medium">
          Once you delete this community, there is no going back. Please be absolutely certain.
        </p>

        <Button
          type="button"
          variant="destructive"
          onClick={() => setDeleteConfirmationOpen(true)}
          disabled={loading}
          size="sm"
        >
          Delete Community
        </Button>
      </div>

      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
        onConfirm={handleDelete}
        title="Delete Community"
        body={`Are you sure you want to delete c/${communityId}? This action cannot be undone and will delete all posts, comments, and members.`}
        confirmButtonText="Delete Community"
        isLoading={loading}
      />
    </div>
  );
}
