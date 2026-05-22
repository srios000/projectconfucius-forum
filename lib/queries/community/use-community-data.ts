"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunityDataAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useCommunityDataQuery({
    communityId,
    enabled = true,
}: {
    communityId: string | undefined;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: keys.community.detail(communityId ?? ""),
        queryFn: () => getCommunityDataAction(communityId!),
        enabled: enabled && !!communityId,
        staleTime: 60_000,
    });
}