"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAdminAction } from "@/app/actions/admin";
import { keys } from "@/lib/queries/keys";

export type AddAdminArgs = { communityId: string; targetUserId: string };

export function useAddAdminMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: AddAdminArgs) =>
            addAdminAction(communityId, targetUserId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.community.admins(vars.communityId) });
        },
    });
}