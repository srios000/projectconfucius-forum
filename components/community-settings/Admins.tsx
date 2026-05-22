"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { useCommunityAdminsListQuery } from "@/lib/queries/admin/use-admin-list";
import { useCommunityMembersQuery } from "@/lib/queries/community/use-community-members";
import useAddAdmin from "@/hooks/admin/useAddAdmin";
import useRemoveAdmin from "@/hooks/admin/useRemoveAdmin";
import { addAdminSchema, AddAdminInput } from "@/schema/admin";
import { CommunityMember } from "@/types/communityMember";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";

type AdminsProps = {
  communityId: string;
};

export default function Admins({ communityId }: AdminsProps) {
  const { data: communityData, isLoading: communityLoading } = useCommunityDataQuery({
    communityId,
  });

  const adminsQuery = useCommunityAdminsListQuery({ communityId });
  const admins = useMemo(() => adminsQuery.data ?? [], [adminsQuery.data]);
  const adminsLoading = adminsQuery.isLoading;

  const membersQuery = useCommunityMembersQuery({ communityId });
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const { handleAddAdmin } = useAddAdmin();
  const { handleRemoveAdmin } = useRemoveAdmin();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AddAdminInput>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { username: "" },
  });

  const usernameValue = useWatch({ control, name: "username" });

  const [addingAdmin, setAddingAdmin] = useState(false);
  const [searchResults, setSearchResults] = useState<CommunityMember[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [removingAdmin, setRemovingAdmin] = useState(false);

  const onAddAdmin = async (data: AddAdminInput) => {
    if (!communityData) return;
    setAddingAdmin(true);
    try {
      const newUser = members.find((m) => m.username === data.username);

      if (!newUser) {
        toast.error("User not found", {
          description: "No community member found with that username.",
        });
        setAddingAdmin(false);
        return;
      }

      if (admins.some((admin) => admin.uid === newUser.id)) {
        toast.warning("Already admin", {
          description: "This user is already an admin of this community.",
        });
        setAddingAdmin(false);
        return;
      }

      await handleAddAdmin(communityData.id, newUser.id);
      reset();
      toast.success("Admin Added", {
        description: `u/${newUser.username} is now an admin.`,
      });
    } catch (error: any) {
      console.error("Error adding admin", error);
      toast.error("Error", {
        description: "Could not add user as admin.",
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToRemove || !communityData) return;
    setRemovingAdmin(true);
    try {
      await handleRemoveAdmin(communityData.id, adminToRemove);
      toast.success("Admin Removed", {
        description: "User is no longer an admin of this community.",
      });
    } catch (error: any) {
      console.error("Error removing admin", error);
      toast.error("Error", {
        description: "Could not remove admin.",
      });
    } finally {
      setRemovingAdmin(false);
      setAdminToRemove(null);
    }
  };

  useEffect(() => {
    if (!usernameValue || usernameValue.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    const query = usernameValue.toLowerCase();
    const results = members.filter((m) => 
      m.username && m.username.toLowerCase().includes(query)
    );
    // Filter out existing admins
    const filtered = results.filter((u) => !admins.some((a) => a.uid === u.id));
    setSearchResults(filtered);
    setShowResults(true);
  }, [usernameValue, admins, members]);

  if (communityLoading || !communityData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Manage Admins</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Add or remove moderators who can manage c/{communityId}.
        </p>
      </div>

      <div className="relative">
        <form onSubmit={handleSubmit(onAddAdmin)} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Enter username to add admin"
              {...register("username")}
              onFocus={() => usernameValue && usernameValue.length >= 3 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-popover text-popover-foreground border border-border shadow-lg rounded-xl mt-1 max-h-48 overflow-y-auto divide-y divide-border">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="w-full text-left p-3 hover:bg-muted/60 transition-colors flex flex-col cursor-pointer"
                    onMouseDown={() => {
                      setValue("username", user.username || "");
                      setShowResults(false);
                    }}
                  >
                    <span className="text-sm font-medium">u/{user.username}</span>
                    {user.displayName && (
                      <span className="text-xs text-muted-foreground">{user.displayName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={addingAdmin || !usernameValue}>
            {addingAdmin ? "Adding…" : "Add"}
          </Button>
        </form>
        {errors.username && <p className="text-xs text-destructive mt-1.5">{errors.username.message}</p>}
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Current Admins
        </h3>

        {adminsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
            {admins.map((admin) => (
              <div key={admin.uid} className="flex items-center justify-between p-3.5">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-foreground">
                    {admin.displayName || "No Name"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{admin.email}</div>
                </div>

                {admin.uid !== communityData.creatorId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-border"
                    onClick={() => setAdminToRemove(admin.uid)}
                  >
                    Remove
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic font-medium bg-muted px-2.5 py-1 rounded-md">
                    Creator
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!adminToRemove}
        onClose={() => setAdminToRemove(null)}
        onConfirm={confirmRemoveAdmin}
        title="Remove Admin"
        body="Are you sure you want to remove this user from the community administrators? They will lose access to management settings."
        confirmButtonText="Remove Admin"
        isLoading={removingAdmin}
      />
    </div>
  );
}
