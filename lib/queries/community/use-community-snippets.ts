"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommunitySnippetsAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export function useCommunitySnippetsQuery() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    return useQuery({
        queryKey: keys.community.snippets(userId ?? ""),
        queryFn: () => getCommunitySnippetsAction(),
        enabled: !!userId,
    });
}