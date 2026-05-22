"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { AdminUser } from "@/types/adminUser";

export function useCommunityAdminsListQuery({
    communityId,
    enabled = true,
}: {
    communityId: string;
    enabled?: boolean;
}) {
    return useQuery<AdminUser[]>({
        queryKey: keys.community.admins(communityId),
        queryFn: () => fetchCommunityAdminsAction(communityId),
        enabled: enabled && !!communityId,
        staleTime: 0, // matches the per-key override in parent spec §5 (admin = security-relevant, always re-validate)
    });
}