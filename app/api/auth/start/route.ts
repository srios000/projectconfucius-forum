import { NextRequest, NextResponse } from "next/server";

// MUST be a Route Handler (not a Server Action): a cross-origin redirect from
// a Server Action triggers a CORS preflight. A 303 is followed natively.
export async function GET(req: NextRequest) {
    const origin = new URL(
        process.env.BETTER_AUTH_URL ?? "https://forum.projectconfucius.id",
    ).origin;
    const raw = req.nextUrl.searchParams.get("callbackUrl") ?? "/";
    const cb = /^https?:\/\//.test(raw) ? raw : new URL(raw, origin).toString();
    const url = new URL("https://login.projectconfucius.id/sign-in");
    url.searchParams.set("callbackURL", cb);
    return NextResponse.redirect(url, 303);
}