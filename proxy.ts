import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that require an authenticated user. Read/list pages stay public
// (guest vote-ranked feed). Mutations are guarded server-side via requireUser.
const PROTECTED = [/^\/community\/[^/]+\/submit/];

export function proxy(req: NextRequest) {
    const needsAuth = PROTECTED.some((re) => re.test(req.nextUrl.pathname));
    if (!needsAuth) return NextResponse.next();
    const cookie = getSessionCookie(req);
    if (!cookie) {
        const url = new URL("/api/auth/start", req.url);
        url.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(url, 303);
    }
    return NextResponse.next();
}

export const config = { matcher: ["/community/:path*"] };