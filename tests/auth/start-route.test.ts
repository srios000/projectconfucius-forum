import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/auth/start/route";
import { NextRequest } from "next/server";

describe("/api/auth/start", () => {
    it("303-redirects to central sign-in with absolute callbackURL", async () => {
        const req = new NextRequest("https://forum.projectconfucius.id/api/auth/start?callbackUrl=/communities");
        const res = await GET(req);
        expect(res.status).toBe(303);
        const loc = new URL(res.headers.get("location")!);
        expect(loc.origin).toBe("https://login.projectconfucius.id");
        expect(loc.searchParams.get("callbackURL")).toMatch(/^https?:\/\//);
    });
});