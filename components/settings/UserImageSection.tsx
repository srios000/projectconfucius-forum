import { SessionUser } from "@/types/sessionUser";
import React, { RefObject } from "react";
import { MdAccountCircle } from "react-icons/md";
import { Button } from "@/components/ui/button";

type UserImageSectionProps = {
  user: SessionUser | null | undefined;
  selectedFile: string | undefined;
  isEditing: boolean;
  selectFileRef: RefObject<HTMLInputElement | null>;
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setDeleteImage: (value: boolean) => void;
  deleteImage: boolean;
};

const UserImageSection: React.FC<UserImageSectionProps> = ({
  user,
  selectedFile,
  isEditing,
  selectFileRef,
  onSelectFile,
  setDeleteImage,
  deleteImage,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-2 space-y-4">
      <div className="flex flex-col items-center gap-3">
        {user?.image || selectedFile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedFile || (user?.image as string)}
            alt="User Photo"
            className="size-30 rounded-full object-cover shadow-md"
          />
        ) : (
          <MdAccountCircle className="size-30 text-muted-foreground/45" />
        )}
        <span className="text-xl font-bold text-foreground">
          {user?.name}
        </span>
      </div>

      {isEditing && (
        <div className="flex gap-2 w-full max-w-75">
          <Button
            type="button"
            className="flex-1"
            size="sm"
            onClick={() => selectFileRef.current?.click()}
          >
            {user?.image ? "Change Image" : "Add Image"}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/png,image/gif,image/jpeg"
            className="hidden"
            ref={selectFileRef}
            onChange={onSelectFile}
          />
          {user?.image && (
            <Button
              type="button"
              className="flex-1"
              variant="outline"
              size="sm"
              onClick={() => setDeleteImage(true)}
              disabled={deleteImage}
            >
              Delete Image
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserImageSection;
