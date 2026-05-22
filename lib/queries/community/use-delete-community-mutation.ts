"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";
import type { Community } from "@/types/community";

export type DeleteCommunityArgs = { communityData: Community };

export function useDeleteCommunityMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ communityData }: DeleteCommunityArgs) => deleteCommunityAction(communityData),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({
                predicate: (q) => q.queryKey[0] === "community" && q.queryKey[1] === "list",
            });
            void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityData.id) });
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
            }
        },
    });
}