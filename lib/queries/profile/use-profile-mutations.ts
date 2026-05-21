"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/upload/uploadImage";
import { profileNameAction, removeProfileImageAction } from "@/app/actions/profile";
import { useSession } from "@/lib/auth-client";
import { keys } from "@/lib/queries/keys";

export type UploadProfileImageArgs = { blob: Blob };

export function useUploadProfileImageMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ blob }: UploadProfileImageArgs) => uploadImage("profile-image", blob),
        onSuccess: () => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.profile(userId) });
            }
        },
    });
}

export function useRemoveProfileImageMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: () => removeProfileImageAction(),
        onSuccess: () => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.profile(userId) });
            }
        },
    });
}

export type UpdateProfileNameArgs = { name: string };

export function useUpdateProfileNameMutation() {
    const qc = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "";
    return useMutation({
        mutationFn: ({ name }: UpdateProfileNameArgs) => profileNameAction(name),
        onSuccess: () => {
            if (userId) {
                void qc.invalidateQueries({ queryKey: keys.profile(userId) });
            }
        },
    });
}