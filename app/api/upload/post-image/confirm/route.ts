import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { forumObjectExists, getForumPublicUrl } from "@/lib/storage/r2-forum";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { key?: string };
    const key = body.key ?? "";
    if (!key.startsWith("posts/")) {
        return NextResponse.json({ message: "Invalid key" }, { status: 400 });
    }

    if (!(await forumObjectExists(key))) {
        return NextResponse.json({ message: "File not found in storage" }, { status: 400 });
    }

    return NextResponse.json({ imageUrl: getForumPublicUrl(key) });
}