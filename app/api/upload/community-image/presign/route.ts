import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { provisionLocalUser } from "@/lib/auth/provision";
import { isModerator } from "@/lib/auth/requireModerator";
import {
    ALLOWED_CONTENT_TYPES,
    MAX_IMAGE_BYTES,
    communityImageKey,
    extFromContentType,
    generateForumPresignedPutUrl,
    getForumPublicUrl,
} from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as { contentType?: string; communityId?: string };
    const { contentType = "", communityId = "" } = body;

    if (!communityId) {
        return NextResponse.json({ message: "Missing communityId" }, { status: 400 });
    }
    if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
        return NextResponse.json(
            { message: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}` },
            { status: 400 },
        );
    }

    const local = await provisionLocalUser({
        authUserId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? session.user.email,
    });
    if (!(await isModerator(local.id, communityId))) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const ext = extFromContentType(contentType)!;
    const fileId = crypto.randomUUID();
    const key = communityImageKey(communityId, fileId, ext);
    const presignedUrl = await generateForumPresignedPutUrl(key, contentType);
    return NextResponse.json({
        presignedUrl,
        key,
        publicUrl: getForumPublicUrl(key),
        maxSize: MAX_IMAGE_BYTES,
    });
}