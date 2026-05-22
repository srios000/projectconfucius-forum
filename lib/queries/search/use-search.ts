"use client";

import { useQuery } from "@tanstack/react-query";
import { getSearchDataAction } from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useSearchQuery({
    term,
    enabled = true,
}: {
    term: string;
    enabled?: boolean;
}) {
    const trimmed = term.trim();
    return useQuery({
        queryKey: keys.search(trimmed),
        queryFn: () => getSearchDataAction(trimmed),
        enabled: enabled && trimmed.length > 0,
        staleTime: 60_000,
    });
}