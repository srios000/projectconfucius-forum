import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/upload/uploadImage";
import { deleteCommunityBannerAction } from "@/app/actions/community";
import { keys } from "@/lib/queries/keys";

type UploadArgs = { communityId: string; blob: Blob };

export function useUploadCommunityBannerMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId, blob }: UploadArgs) =>
            uploadImage("community-banner", blob, communityId),
        onSuccess: (_d, v) => {
            void qc.invalidateQueries({ queryKey: keys.community.detail(v.communityId) });
        },
    });
}

export function useDeleteCommunityBannerMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ communityId }: { communityId: string }) =>
            deleteCommunityBannerAction(communityId),
        onSuccess: (_d, v) => {
            void qc.invalidateQueries({ queryKey: keys.community.detail(v.communityId) });
        },
    });
}
