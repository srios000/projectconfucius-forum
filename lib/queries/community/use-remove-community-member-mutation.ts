"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeCommunityMemberAction } from "@/app/actions/community";
import { keys } from "@/lib/queries/keys";

export type RemoveCommunityMemberArgs = { communityId: string; memberId: string };

export function useRemoveCommunityMemberMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, memberId }: RemoveCommunityMemberArgs) =>
            removeCommunityMemberAction(communityId, memberId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.community.members(vars.communityId) });
            void qc.invalidateQueries({ queryKey: keys.community.snippets(vars.memberId) });
        },
    });
}