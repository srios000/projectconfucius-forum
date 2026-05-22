"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import useCommunityImage from "@/hooks/community/useCommunityImage";
import {
  useUploadCommunityBannerMutation,
  useDeleteCommunityBannerMutation,
} from "@/hooks/community/useCommunityBanner";
import useImageCropFlow from "@/hooks/useImageCropFlow";
import ImageCropModal from "@/components/modal/image-crop/ImageCropModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ImageSettingsProps = {
  communityId: string;
};

export default function ImageSettings({ communityId }: ImageSettingsProps) {
  const { data: communityData, isLoading } = useCommunityDataQuery({ communityId });
  const { selectedFile, selectedBlob, setSelectedFile, onSelectFile, cropModalProps } =
    useImageCropFlow();
  const selectFileRef = useRef<HTMLInputElement>(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hook receives communityData
  const { updateImage, deleteCommunityImage, uploadingImage } = useCommunityImage(
    communityData || ({} as any)
  );
  const uploadBanner = useUploadCommunityBannerMutation();
  const removeBanner = useDeleteCommunityBannerMutation();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerSaving, setBannerSaving] = useState(false);

  const onBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBannerSaving(true);
    try {
      await uploadBanner.mutateAsync({ communityId, blob: file });
      toast.success("Banner updated");
    } catch (err) {
      toast.error("Banner upload failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setBannerSaving(false);
    }
  };

  const onBannerDelete = async () => {
    setBannerSaving(true);
    try {
      await removeBanner.mutateAsync({ communityId });
      toast.success("Banner removed");
    } catch (err) {
      toast.error("Banner delete failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setBannerSaving(false);
    }
  };

  if (isLoading || !communityData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-col items-center gap-4 py-6">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  const imageToDisplay = selectedFile || communityData.imageUrl;
  const isDirty = !!selectedBlob || deleteImage;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedBlob) {
        await updateImage(selectedBlob);
        setSelectedFile("");
      }
      if (deleteImage) {
        await deleteCommunityImage();
        setDeleteImage(false);
      }
      toast.success("Image Updated", {
        description: "Community logo has been updated successfully.",
      });
    } catch (err) {
      // error toast is already shown by useCommunityImage
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Community Logo</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload an image to represent c/{communityId}.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 py-4 bg-muted/20 border border-border/60 rounded-xl">
        {imageToDisplay && !deleteImage ? (
          <img
            src={imageToDisplay}
            className="size-24 rounded-full object-cover border-2 border-primary/20 shadow-sm"
            alt="Community Avatar Preview"
          />
        ) : (
          <div className="size-24 rounded-full border border-dashed border-muted-foreground/30 bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectFileRef.current?.click()}
            disabled={saving || uploadingImage}
          >
            Change Image
          </Button>

          {(communityData.imageUrl || selectedFile) && (
            <Button
              type="button"
              variant={deleteImage ? "destructive" : "outline"}
              size="sm"
              onClick={() => setDeleteImage(!deleteImage)}
              disabled={saving || uploadingImage}
            >
              {deleteImage ? "Undo Delete" : "Delete Image"}
            </Button>
          )}
        </div>

        <input
          ref={selectFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onSelectFile}
        />
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving || uploadingImage}
          size="sm"
        >
          {saving || uploadingImage ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="border-t border-border pt-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Community Banner</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Wide hero image displayed at the top of c/{communityId}.
          </p>
        </div>
        <div className="aspect-[5/1] w-full rounded-xl overflow-hidden border border-border/60 bg-muted/40 flex items-center justify-center">
          {communityData.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={communityData.bannerUrl} alt="Community banner" className="size-full object-cover" />
          ) : (
            <div className="text-xs text-muted-foreground">No banner</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerSaving}
          >
            {communityData.bannerUrl ? "Change Banner" : "Upload Banner"}
          </Button>
          {communityData.bannerUrl && (
            <Button type="button" variant="destructive" size="sm" onClick={onBannerDelete} disabled={bannerSaving}>
              Remove
            </Button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onBannerFile}
          />
        </div>
      </div>

      <ImageCropModal {...cropModalProps} title="Crop community image" />
    </div>
  );
}
