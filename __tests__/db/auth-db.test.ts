import { describe, it, expect } from "vitest";
import * as s from "@/lib/db/auth-schema";

describe("auth schema mirror", () => {
    it("declares the four Better Auth core tables", () => {
        expect(s.user).toBeDefined();
        expect(s.session).toBeDefined();
        expect(s.account).toBeDefined();
        expect(s.verification).toBeDefined();
    });
});