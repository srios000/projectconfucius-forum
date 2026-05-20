import { describe, it, expect } from "vitest";
import { computeSourceRect } from "@/lib/image/cropToBlob";
import type { PixelCrop } from "react-image-crop";

describe("computeSourceRect", () => {
  const crop = (x: number, y: number, w: number, h: number): PixelCrop => ({
    unit: "px",
    x,
    y,
    width: w,
    height: h,
  });

  it("returns identity when displayed size matches natural size", () => {
    const image = { naturalWidth: 800, naturalHeight: 600, width: 800, height: 600 };
    expect(computeSourceRect(image, crop(10, 20, 100, 100))).toEqual({
      sx: 10,
      sy: 20,
      sw: 100,
      sh: 100,
    });
  });

  it("scales crop coords up when image is displayed smaller than natural", () => {
    const image = { naturalWidth: 1600, naturalHeight: 1200, width: 800, height: 600 };
    expect(computeSourceRect(image, crop(50, 50, 200, 200))).toEqual({
      sx: 100,
      sy: 100,
      sw: 400,
      sh: 400,
    });
  });

  it("handles non-uniform x/y scale (rare, but defensively correct)", () => {
    const image = { naturalWidth: 2000, naturalHeight: 1000, width: 1000, height: 1000 };
    expect(computeSourceRect(image, crop(100, 100, 100, 100))).toEqual({
      sx: 200,
      sy: 100,
      sw: 200,
      sh: 100,
    });
  });
});
