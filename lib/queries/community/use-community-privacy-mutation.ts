"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCommunityPrivacyAction } from "@/app/actions/community";
import { keys } from "@/lib/queries/keys";

export type CommunityPrivacyArgs = { communityId: string; privacyType: string };

export function useCommunityPrivacyMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, privacyType }: CommunityPrivacyArgs) =>
            updateCommunityPrivacyAction(communityId, privacyType),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
        },
    });
}