import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    ALLOWED_CONTENT_TYPES,
    MAX_IMAGE_BYTES,
    extFromContentType,
    generateForumPresignedPutUrl,
    getForumPublicUrl,
    postImageKey,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { contentType?: string };
    const contentType = body.contentType ?? "";
    if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
        return NextResponse.json(
            {
                message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
            },
            { status: 400 },
        );
    }

    const ext = extFromContentType(contentType)!;
    const fileId = crypto.randomUUID();
    const key = postImageKey(fileId, ext);
    const presignedUrl = await generateForumPresignedPutUrl(key, contentType);

    return NextResponse.json({
        presignedUrl,
        key,
        publicUrl: getForumPublicUrl(key),
        maxSize: MAX_IMAGE_BYTES,
    });
}