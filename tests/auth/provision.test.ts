import { describe, it, expect, vi, beforeEach } from "vitest";

const { findFirst, insert, update } = vi.hoisted(() => ({
    findFirst: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
    db: {
        query: { users: { findFirst } },
        insert: () => ({ values: () => ({ returning: insert }) }),
        update: () => ({ set: () => ({ where: () => ({ returning: update }) }) }),
    },
}));

import { provisionLocalUser } from "@/lib/auth/provision";

beforeEach(() => { findFirst.mockReset(); insert.mockReset(); update.mockReset(); });

describe("provisionLocalUser", () => {
    it("returns the row found by authUserId", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1" });
        const r = await provisionLocalUser({ authUserId: "a1", email: "X@x.com", name: "X" });
        expect(r.id).toBe("u1");
    });

    it("relinks the email row when authUserId misses", async () => {
        findFirst.mockResolvedValueOnce(undefined);          // by authUserId
        findFirst.mockResolvedValueOnce({ id: "u2" });        // by email
        update.mockResolvedValueOnce([{ id: "u2" }]);
        const r = await provisionLocalUser({ authUserId: "a2", email: "Y@y.com", name: "Y" });
        expect(r.id).toBe("u2");
        expect(update).toHaveBeenCalled();
    });

    it("creates when neither key matches", async () => {
        findFirst.mockResolvedValueOnce(undefined);
        findFirst.mockResolvedValueOnce(undefined);
        insert.mockResolvedValueOnce([{ id: "u3" }]);
        const r = await provisionLocalUser({ authUserId: "a3", email: "Z@z.com", name: "Z" });
        expect(r.id).toBe("u3");
        expect(insert).toHaveBeenCalled();
    });
});