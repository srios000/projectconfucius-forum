import type { PixelCrop } from "react-image-crop";

export type SourceRect = { sx: number; sy: number; sw: number; sh: number };

export function computeSourceRect(
  image: { naturalWidth: number; naturalHeight: number; width: number; height: number },
  crop: PixelCrop,
): SourceRect {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  return {
    sx: crop.x * scaleX,
    sy: crop.y * scaleY,
    sw: crop.width * scaleX,
    sh: crop.height * scaleY,
  };
}

export async function cropToBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  outputSize = 300,
): Promise<Blob> {
  const { sx, sy, sw, sh } = computeSourceRect(image, crop);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("cropToBlob: no 2d context");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputSize, outputSize);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("cropToBlob: toBlob returned null"))),
      "image/jpeg",
      0.9,
    );
  });
}
