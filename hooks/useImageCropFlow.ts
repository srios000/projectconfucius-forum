"use client";

import { useCallback, useState } from "react";
import useCustomToast from "./useCustomToast";

const MAX_IMAGE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"] as const;

/**
 * File-picker -> crop-modal -> blob flow for profile / community avatars.
 * Matches the (selectedFile, selectedBlob, setSelectedFile) shape so call
 * sites that previously used useSelectFile change minimally. Posts keep
 * using useSelectFile (which rejects oversized images instead of cropping).
 */
const useImageCropFlow = () => {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFileState] = useState<string | undefined>();
  const [selectedBlob, setSelectedBlob] = useState<Blob | undefined>();
  const showToast = useCustomToast();

  const onSelectFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset the input so picking the same file twice fires onChange again
      event.target.value = "";
      if (!file) return;

      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        showToast({
          title: "File size is too large",
          description: `Maximum file size is ${MAX_IMAGE_MB}MB.`,
          status: "error",
        });
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
        showToast({
          title: "File type not allowed",
          description: "Only .png / .jpeg / .gif images are allowed.",
          status: "error",
        });
        return;
      }
      setPendingFile(file);
    },
    [showToast],
  );

  const onCropCancel = useCallback(() => setPendingFile(null), []);

  const onCropApply = useCallback((blob: Blob, dataUrl: string) => {
    setSelectedBlob(blob);
    setSelectedFileState(dataUrl);
    setPendingFile(null);
  }, []);

  const setSelectedFile = useCallback((value: string | undefined) => {
    setSelectedFileState(value);
    if (!value) setSelectedBlob(undefined);
  }, []);

  return {
    selectedFile,
    selectedBlob,
    setSelectedFile,
    onSelectFile,
    cropModalProps: {
      open: pendingFile !== null,
      file: pendingFile,
      onCancel: onCropCancel,
      onApply: onCropApply,
    },
  };
};

export default useImageCropFlow;
