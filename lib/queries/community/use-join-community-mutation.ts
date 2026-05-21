"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinCommunityAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";
import type { Community } from "@/types/community";

export type JoinCommunityArgs = { communityData: Community };

export function useJoinCommunityMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ communityData }: JoinCommunityArgs) => joinCommunityAction(communityData),
        onSuccess: (_data, vars) => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
            }
            void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityData.id) });
            void qc.invalidateQueries({ queryKey: keys.community.members(vars.communityData.id) });
        },
    });
}