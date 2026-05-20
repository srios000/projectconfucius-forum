"use client";

import {
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Stack,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
  type PercentCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cropToBlob } from "@/lib/image/cropToBlob";
import useCustomToast from "@/hooks/useCustomToast";

type ImageCropModalProps = {
  open: boolean;
  file: File | null;
  outputSize?: number;
  circular?: boolean;
  title?: string;
  onCancel: () => void;
  onApply: (blob: Blob, dataUrl: string) => void;
};

function centerSquareCrop(width: number, height: number): PercentCrop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
    width,
    height,
  );
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  file,
  outputSize = 300,
  circular = true,
  title = "Crop Image",
  onCancel,
  onApply,
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>();
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const showToast = useCustomToast();

  useEffect(() => {
    if (!file) {
      setImgSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImgSrc(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }, [file]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  };

  const handleApply = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(imgRef.current, completedCrop, outputSize);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(blob);
      });
      onApply(blob, dataUrl);
    } catch (err) {
      showToast({
        title: "Could not crop image",
        description: err instanceof Error ? err.message : "Unknown error",
        status: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open }) => {
        if (!open) onCancel();
      }}
    >
      <DialogBackdrop bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(6px)" />
      <DialogPositioner>
        <DialogContent borderRadius={10} maxW="520px">
          <DialogHeader padding={3} textAlign="center">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogCloseTrigger position="absolute" top={2} right={2} />
          <DialogBody padding={4}>
            {imgSrc ? (
              <Box display="flex" justifyContent="center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={circular}
                  keepSelection
                  minWidth={50}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop source"
                    onLoad={onImageLoad}
                    style={{ maxHeight: "60vh", maxWidth: "100%" }}
                  />
                </ReactCrop>
              </Box>
            ) : (
              <Box textAlign="center" color="gray.500" py={8}>
                Loading image…
              </Box>
            )}
          </DialogBody>
          <DialogFooter bg={{ base: "gray.100", _dark: "gray.700" }} borderRadius="0px 0px 10px 10px">
            <Stack direction="row" width="100%" gap={2}>
              <Button variant="outline" height="30px" flex={1} onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
              <Button
                height="30px"
                flex={1}
                onClick={handleApply}
                disabled={!completedCrop || completedCrop.width === 0}
                loading={busy}
              >
                Apply
              </Button>
            </Stack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};

export default ImageCropModal;
