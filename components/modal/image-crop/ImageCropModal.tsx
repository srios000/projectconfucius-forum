"use client";

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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset crop state when the modal's file prop clears
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
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-center font-serif text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-5 flex justify-center min-h-[200px]">
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop={circular}
              keepSelection
              minWidth={50}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- in-browser FileReader data URL preview; next/image adds no value here */}
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop source"
                onLoad={onImageLoad}
                style={{ maxHeight: "55vh", maxWidth: "100%" }}
              />
            </ReactCrop>
          ) : (
            <div className="text-center text-muted-foreground flex items-center justify-center py-8">
              Loading image…
            </div>
          )}
        </div>
        <DialogFooter className="px-5 py-3.5 bg-muted/30 border-t border-border flex gap-3">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onCancel(); }} disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); handleApply(); }}
            disabled={!completedCrop || completedCrop.width === 0 || busy}
          >
            {busy ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
