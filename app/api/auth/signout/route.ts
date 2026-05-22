import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    await auth.api.signOut({ headers: req.headers });
    return NextResponse.redirect(new URL("/", req.url), 303);
}