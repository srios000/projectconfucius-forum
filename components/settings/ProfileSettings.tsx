"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth-client";
import useImageCropFlow from "@/hooks/useImageCropFlow";
import useUserProfile from "@/hooks/useUserProfile";
import ImageCropModal from "@/components/modal/image-crop/ImageCropModal";
import UserImageSection from "./UserImageSection";
import UserInfoSection from "./UserInfoSection";
import { editProfileSchema, EditProfileInput } from "@/schema/profile";
import { Button } from "@/components/ui/button";

export default function ProfileSettings() {
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { updateImage, removeImage, updateName, loading } = useUserProfile();
  const { selectedFile, selectedBlob, setSelectedFile, onSelectFile, cropModalProps } =
    useImageCropFlow();
  const selectFileRef = useRef<HTMLInputElement>(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: user?.name || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (user?.name) {
      setValue("displayName", user.name);
    }
  }, [user, setValue]);

  const handleCancel = () => {
    setSelectedFile("");
    setDeleteImage(false);
    setIsEditing(false);
    if (user?.name) {
      setValue("displayName", user.name);
    }
  };

  const onUpdateProfile = async (data: EditProfileInput) => {
    if (selectedBlob) {
      await updateImage(selectedBlob);
    }
    if (deleteImage) {
      await removeImage();
    }
    if (data.displayName !== user?.name) {
      await updateName(data.displayName);
    }
    setSelectedFile("");
    setDeleteImage(false);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">Manage your public profile and user identity.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <UserImageSection
          user={user}
          selectedFile={selectedFile}
          isEditing={isEditing}
          selectFileRef={selectFileRef}
          onSelectFile={onSelectFile}
          setDeleteImage={setDeleteImage}
          deleteImage={deleteImage}
        />

        <div className="border-t border-border pt-6">
          <UserInfoSection
            user={user}
            isEditing={isEditing}
            register={register}
            errors={errors}
          />
        </div>

        <div className="border-t border-border pt-4 flex justify-end gap-3">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit(onUpdateProfile)}
                disabled={loading}
              >
                {loading ? "Saving…" : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <ImageCropModal {...cropModalProps} title="Crop profile image" />
    </div>
  );
}
