"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCommunityMembersAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { CommunityMember } from "@/types/communityMember";

export function useCommunityMembersListQuery({
    communityId,
    enabled = true,
}: {
    communityId: string;
    enabled?: boolean;
}) {
    return useQuery<CommunityMember[]>({
        queryKey: keys.community.members(communityId),
        queryFn: () => fetchCommunityMembersAction(communityId),
        enabled: enabled && !!communityId,
    });
}