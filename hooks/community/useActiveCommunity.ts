"use client";

import { useParams } from "next/navigation";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";

export function useActiveCommunity() {
    const params = useParams<{ communityId?: string }>();
    const communityId = params?.communityId;
    const query = useCommunityDataQuery({
        communityId: communityId ?? "",
        enabled: !!communityId,
    });
    return {
        communityId,
        community: communityId ? query.data ?? undefined : undefined,
        isLoading: query.isLoading,
    };
}