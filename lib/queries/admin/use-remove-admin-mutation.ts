"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeAdminAction } from "@/app/actions/admin";
import { keys } from "@/lib/queries/keys";

export type RemoveAdminArgs = { communityId: string; targetUserId: string };

export function useRemoveAdminMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: RemoveAdminArgs) =>
            removeAdminAction(communityId, targetUserId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.community.admins(vars.communityId) });
        },
    });
}