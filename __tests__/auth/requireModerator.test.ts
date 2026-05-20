import { describe, it, expect, vi, beforeEach } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/db", () => ({
    db: { query: { communityMembers: { findFirst } } },
}));

import { isModerator } from "@/lib/auth/requireModerator";

beforeEach(() => findFirst.mockReset());

describe("isModerator", () => {
    it("true when row exists with isModerator=true", async () => {
        findFirst.mockResolvedValueOnce({ isModerator: true });
        expect(await isModerator("u1", "c1")).toBe(true);
    });
    it("false when row exists but isModerator=false", async () => {
        findFirst.mockResolvedValueOnce({ isModerator: false });
        expect(await isModerator("u1", "c1")).toBe(false);
    });
    it("false when no membership row", async () => {
        findFirst.mockResolvedValueOnce(undefined);
        expect(await isModerator("u1", "c1")).toBe(false);
    });
});