"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityMembersAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useCommunityMembersQuery({
    communityId,
    enabled = true,
}: {
    communityId: string;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: keys.community.members(communityId),
        queryFn: () => fetchCommunityMembersAction(communityId),
        enabled: enabled && !!communityId,
    });
}