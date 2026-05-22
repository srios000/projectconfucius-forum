"use client";

import { useQuery } from "@tanstack/react-query";
import { getSavedPostsAction } from "@/app/actions/posts";
import { keys } from "@/lib/queries/keys";
import { useSession } from "@/lib/auth-client";

export function useSavedPostsQuery() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    return useQuery({
        queryKey: keys.posts.saved(userId ?? ""),
        queryFn: () => getSavedPostsAction(),
        enabled: !!userId,
    });
}