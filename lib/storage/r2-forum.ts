import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// FORUM_R2_* preferred; fall back to shared R2_* (matches projectk's
// per-domain-with-shared-fallback convention).
const accountId = process.env.FORUM_R2_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID;
const accessKeyId =
    process.env.FORUM_R2_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID;
const secretAccessKey =
    process.env.FORUM_R2_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY;

const BUCKET = process.env.FORUM_R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.FORUM_R2_PUBLIC_URL!;

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
});

export const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/gif"] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB, matches useSelectFile

const EXT_BY_TYPE: Record<AllowedContentType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
};

export function extFromContentType(contentType: string): string | null {
    return (EXT_BY_TYPE as Record<string, string>)[contentType] ?? null;
}

export function postImageKey(fileId: string, ext: string): string {
    return `posts/${fileId}.${ext}`;
}

export function communityImageKey(communityId: string, fileId: string, ext: string): string {
    return `communities/${communityId}/${fileId}.${ext}`;
}

export function communityBannerKey(communityId: string, fileId: string, ext: string): string {
    return `communities/${communityId}/banner/${fileId}.${ext}`;
}

export function userImageKey(userId: string, fileId: string, ext: string): string {
    return `users/${userId}/${fileId}.${ext}`;
}

export function getForumPublicUrl(key: string): string {
    return `${PUBLIC_URL}/${key}`;
}

/** Returns the R2 key if `url` is on our public host, else null. */
export function parseForumObjectKey(url: string | null | undefined): string | null {
    if (!url || typeof url !== "string") return null;
    const prefix = `${PUBLIC_URL}/`;
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length) || null;
}

export async function generateForumPresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
): Promise<string> {
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    return getSignedUrl(r2Client, command, { expiresIn });
}

export async function forumObjectExists(key: string): Promise<boolean> {
    try {
        await r2Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

export async function deleteForumObject(key: string): Promise<void> {
    await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}