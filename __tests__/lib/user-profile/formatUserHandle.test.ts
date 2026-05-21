import { describe, it, expect } from "vitest";
import { formatUserHandle } from "@/lib/user-profile/formatUserHandle";

describe("formatUserHandle", () => {
    it("returns u/<name> for a real username", () => {
        expect(formatUserHandle("alice")).toBe("u/alice");
    });

    it("returns u/deleted when username is null", () => {
        expect(formatUserHandle(null)).toBe("u/deleted");
    });

    it("returns u/deleted when username is undefined", () => {
        expect(formatUserHandle(undefined)).toBe("u/deleted");
    });
});