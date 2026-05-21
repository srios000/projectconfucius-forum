"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type CreateCommunityArgs = { communityName: string; communityType: string };

export function useCreateCommunityMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ communityName, communityType }: CreateCommunityArgs) =>
            createCommunityAction(communityName, communityType),
        onSuccess: () => {
            void qc.invalidateQueries({
                predicate: (q) => q.queryKey[0] === "community" && q.queryKey[1] === "list",
            });
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
            }
        },
    });
}