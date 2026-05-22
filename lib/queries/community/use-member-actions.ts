"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    promoteMemberAction,
    demoteMemberAction,
    kickMemberAction,
    banMemberAction,
    unbanMemberAction,
} from "@/app/actions/community-members";
import { keys } from "@/lib/queries/keys";

type Args = { communityId: string; targetUserId: string };

function invalidate(qc: ReturnType<typeof useQueryClient>, communityId: string) {
    void qc.invalidateQueries({ queryKey: keys.community.members(communityId) });
    void qc.invalidateQueries({ queryKey: keys.community.admins(communityId) });
    void qc.invalidateQueries({ queryKey: keys.community.detail(communityId) });
}

export function usePromoteMemberMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: Args) => promoteMemberAction(communityId, targetUserId),
        onSuccess: (_d, v) => invalidate(qc, v.communityId),
    });
}

export function useDemoteMemberMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: Args) => demoteMemberAction(communityId, targetUserId),
        onSuccess: (_d, v) => invalidate(qc, v.communityId),
    });
}

export function useKickMemberMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: Args) => kickMemberAction(communityId, targetUserId),
        onSuccess: (_d, v) => invalidate(qc, v.communityId),
    });
}

export function useBanMemberMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: Args) => banMemberAction(communityId, targetUserId),
        onSuccess: (_d, v) => invalidate(qc, v.communityId),
    });
}

export function useUnbanMemberMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, targetUserId }: Args) => unbanMemberAction(communityId, targetUserId),
        onSuccess: (_d, v) => invalidate(qc, v.communityId),
    });
}
