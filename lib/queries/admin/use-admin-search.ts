"use client";

import { useQuery } from "@tanstack/react-query";
import {
    searchUsersByEmailAction,
    findUserByEmailAction,
} from "@/app/actions/reads";
import { keys } from "@/lib/queries/keys";

export function useAdminSearchUsersQuery({
    query,
    enabled = true,
}: {
    query: string;
    enabled?: boolean;
}) {
    const trimmed = query.trim();
    return useQuery({
        queryKey: keys.admin.search(trimmed),
        queryFn: () => searchUsersByEmailAction(trimmed),
        enabled: enabled && trimmed.length > 0,
        staleTime: 60_000,
    });
}

export function useAdminFindUserQuery({
    email,
    enabled = true,
}: {
    email: string;
    enabled?: boolean;
}) {
    return useQuery({
        queryKey: [...keys.admin.search(email), "exact"] as const,
        queryFn: () => findUserByEmailAction(email),
        enabled: enabled && email.length > 0,
        staleTime: 60_000,
    });
}