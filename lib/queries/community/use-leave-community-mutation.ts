"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type LeaveCommunityArgs = { communityId: string };

export function useLeaveCommunityMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ communityId }: LeaveCommunityArgs) => leaveCommunityAction(communityId),
        onSuccess: (_data, vars) => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
            }
            void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
            void qc.invalidateQueries({ queryKey: keys.community.members(vars.communityId) });
        },
    });
}