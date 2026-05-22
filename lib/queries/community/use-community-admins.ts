"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAdminsAction } from "@/app/actions/reads";
import { AdminUser } from "@/types/adminUser";
import { keys } from "@/lib/queries/keys";

export function useCommunityAdminsQuery({
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
        staleTime: 0,
    });
}