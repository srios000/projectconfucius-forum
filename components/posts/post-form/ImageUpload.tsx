import React, { useRef } from "react";
import { Button } from "@/components/ui/button";

type ImageUploadProps = {
  selectedFile?: string;
  onSelectImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedTab: (value: string) => void;
  setSelectedFile: (value: string) => void;
};

/**
 * Handles image selection and preview for new posts.
 * Provides a drag-and-drop style interface for uploading and options to remove or confirm the selection.
 * @param props - Component properties.
 * @returns A preview of the selected image or an upload trigger.
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  selectedFile,
  onSelectImage,
  setSelectedTab,
  setSelectedFile,
}) => {
  const selectedFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col justify-center items-center w-full">
      {selectedFile ? (
        <>
          <img
            src={selectedFile}
            alt="Uploaded image for post"
            className="max-w-[90%] max-h-[400px] rounded-xl shadow-md object-contain"
          />
          <div className="flex flex-row mt-4 justify-center gap-4 w-full">
            <Button
              onClick={() => setSelectedTab("Post")}
              className="flex-1 max-w-[200px] shadow-md h-9"
            >
              Back to Post
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedFile("")}
              className="flex-1 max-w-[200px] shadow-md h-9"
            >
              Remove Content
            </Button>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center p-20 border border-dashed border-border/80 w-full rounded-xl">
          <Button
            className="shadow-md h-9"
            onClick={() => {
              selectedFileRef.current?.click();
            }}
          >
            Upload Content
          </Button>
          <input
            type="file"
            accept="image/png,image/gif,image/jpeg"
            ref={selectedFileRef}
            className="hidden"
            onChange={onSelectImage}
          />
        </div>
      )}
    </div>
  );
};
export default ImageUpload;
