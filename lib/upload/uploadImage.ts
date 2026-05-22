export type UploadSurface = "post-image" | "community-image" | "community-banner" | "profile-image";

type PresignResponse = {
    presignedUrl: string;
    key: string;
    publicUrl: string;
    maxSize: number;
};

async function readErr(res: Response): Promise<string> {
    try {
        const j = (await res.json()) as { message?: string };
        return j.message ?? `HTTP ${res.status}`;
    } catch {
        return `HTTP ${res.status}`;
    }
}

/**
 * Three-step client-side upload: presign → PUT to R2 → confirm.
 * Returns the final public URL. Throws on any non-2xx step.
 */
export async function uploadImage(
    surface: UploadSurface,
    blob: Blob,
    surfaceId?: string,
): Promise<{ imageUrl: string }> {
    const presignBody: Record<string, unknown> = { contentType: blob.type };
    if (surface === "community-image" || surface === "community-banner") presignBody.communityId = surfaceId;

    const presignRes = await fetch(`/api/upload/${surface}/presign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(presignBody),
    });
    if (!presignRes.ok) throw new Error(`presign: ${await readErr(presignRes)}`);
    const { presignedUrl, key } = (await presignRes.json()) as PresignResponse;

    const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "content-type": blob.type },
        body: blob,
    });
    if (!putRes.ok) throw new Error(`upload to R2 failed (HTTP ${putRes.status})`);

    const confirmBody: Record<string, unknown> = { key };
    if (surface === "community-image" || surface === "community-banner") confirmBody.communityId = surfaceId;

    const confirmRes = await fetch(`/api/upload/${surface}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(confirmBody),
    });
    if (!confirmRes.ok) throw new Error(`confirm: ${await readErr(confirmRes)}`);
    const json = (await confirmRes.json()) as { imageUrl?: string; bannerUrl?: string };
    return { imageUrl: (json.imageUrl ?? json.bannerUrl) as string };
}