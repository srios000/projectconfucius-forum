"use client";

import React, { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useCommunityPrivacy from "@/hooks/community/useCommunityPrivacy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type PrivacyProps = {
  communityId: string;
};

const PRIVACY_TYPES = [
  {
    value: "public",
    label: "Public",
    description: "Everyone can view and post",
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Everyone can view, only members can post",
  },
  {
    value: "private",
    label: "Private",
    description: "Only members can view and post",
  },
];

export default function Privacy({ communityId }: PrivacyProps) {
  const { data: communityData, isLoading } = useCommunityDataQuery({ communityId });
  const [selectedPrivacyType, setSelectedPrivacyType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Hook receives the communityData context
  const { updatePrivacyType } = useCommunityPrivacy(communityData || ({} as any));

  if (isLoading || !communityData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const activePrivacyType = selectedPrivacyType ?? communityData.privacyType ?? "public";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePrivacyType(activePrivacyType);
      toast.success("Settings Updated", {
        description: "Community privacy settings have been updated.",
      });
    } catch (err) {
      // Hook also triggers a toast on error
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Community Type</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose who can view and contribute to c/{communityId}.
        </p>
      </div>

      <div className="space-y-3">
        {PRIVACY_TYPES.map((type) => {
          const isSelected = activePrivacyType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedPrivacyType(type.value)}
              className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-250 cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/45 hover:bg-muted/10"
              }`}
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm text-foreground">{type.label}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
              {isSelected && <FiCheck className="size-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={saving || activePrivacyType === communityData.privacyType}
          size="sm"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
