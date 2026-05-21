"use client";

import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";

export default function SidebarCommunity({ communityId }: { communityId: string }) {
  const { data: community } = useCommunityDataQuery({ communityId });
  if (!community) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5">
      <div className="font-serif text-base font-semibold">c/{community.id}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {community.privacyType === "private"
          ? "Private community — members only."
          : "A community for considered discussion."}
      </p>
      <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
        <span className="text-muted-foreground">
          <strong className="text-foreground">{community.numberOfMembers ?? 0}</strong> members
        </span>
        <span className="text-muted-foreground">
          {community.createdAt
            ? `since ${new Date(community.createdAt).getFullYear()}`
            : ""}
        </span>
      </div>
    </div>
  );
}
