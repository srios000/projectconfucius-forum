"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { getMeAction } from "@/app/actions/profile";

export function useMeQuery() {
    const { data: session } = useSession();
    const authUserId = session?.user?.id;
    return useQuery({
        queryKey: ["me", authUserId ?? "anon"],
        queryFn: () => getMeAction(),
        enabled: !!authUserId,
        staleTime: 5 * 60 * 1000,
    });
}
