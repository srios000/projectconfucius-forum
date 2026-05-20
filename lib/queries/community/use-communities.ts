"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunitiesAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";
import type { CommunityCursor } from "@/lib/community/getCommunities";

export function useCommunitiesQuery({
    limit,
    cursor,
    enabled = true,
}: {
    limit: number;
    cursor: CommunityCursor;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: keys.community.list({ limit, cursor }),
        queryFn: () => getCommunitiesAction(limit, cursor),
        enabled,
    });
}