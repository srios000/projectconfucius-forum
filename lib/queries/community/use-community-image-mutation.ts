"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityImageAction } from "@/app/actions/community";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type UploadCommunityImageArgs = { communityId: string; blob: Blob };

export function useUploadCommunityImageMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ communityId, blob }: UploadCommunityImageArgs) =>
            uploadImage("community-image", blob, communityId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
            }
        },
    });
}

export type DeleteCommunityImageArgs = { communityId: string };

export function useDeleteCommunityImageMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ communityId }: DeleteCommunityImageArgs) =>
            deleteCommunityImageAction(communityId),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: keys.community.detail(vars.communityId) });
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.community.snippets(userId) });
            }
        },
    });
}