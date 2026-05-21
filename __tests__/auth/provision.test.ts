import { describe, it, expect, vi, beforeEach } from "vitest";

const { findFirst, insert, update } = vi.hoisted(() => ({
    findFirst: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
}));

const updateSet = vi.fn();
const updateWhere = vi.fn();

vi.mock("@/lib/db", () => ({
    db: {
        query: { users: { findFirst } },
        insert: () => ({ values: insert }),
        update: () => ({
            set: (patch: unknown) => {
                updateSet(patch);
                return { where: () => ({ returning: update }) };
            },
        }),
    },
}));

import { provisionLocalUser } from "@/lib/auth/provision";

beforeEach(() => {
    findFirst.mockReset();
    insert.mockReset();
    update.mockReset();
    updateSet.mockReset();
    updateWhere.mockReset();
});

const baseInput = {
    authUserId: "a1",
    email: "x@x.com",
    name: "X",
    username: "alice",
    image: "https://cdn/x.png",
};

describe("provisionLocalUser", () => {
    it("inserts all five fields when no row exists", async () => {
        findFirst.mockResolvedValueOnce(undefined); // by authUserId
        findFirst.mockResolvedValueOnce(undefined); // by email
        insert.mockReturnValueOnce({ returning: () => Promise.resolve([{ id: "u-new" }]) });
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u-new");
        const inserted = insert.mock.calls[0][0];
        expect(inserted).toMatchObject({
            authUserId: "a1",
            email: "x@x.com",
            name: "X",
            username: "alice",
            imageUrl: "https://cdn/x.png",
        });
    });

    it("relinks by email and updates username + image + name", async () => {
        findFirst.mockResolvedValueOnce(undefined);                               // by authUserId
        findFirst.mockResolvedValueOnce({ id: "u-existing", imageUrl: null });    // by email
        update.mockResolvedValueOnce([{ id: "u-existing" }]);
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u-existing");
        expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
            authUserId: "a1",
            username: "alice",
            name: "X",
            imageUrl: "https://cdn/x.png",
        }));
    });

    it("on authUserId hit: drift-corrects username; sets image only when local is null", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1", username: "old", imageUrl: null });
        update.mockResolvedValueOnce([{ id: "u1" }]);
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u1");
        expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
            username: "alice",
            imageUrl: "https://cdn/x.png",
        }));
    });

    it("on authUserId hit: does NOT clobber existing local image", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1", username: "alice", imageUrl: "https://forum/x.png" });
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u1");
        // username matched + image already present → no update at all
        expect(updateSet).not.toHaveBeenCalled();
    });

    it("on authUserId hit: skips update when nothing drifted", async () => {
        findFirst.mockResolvedValueOnce({ id: "u1", username: "alice", imageUrl: "https://forum/x.png" });
        const r = await provisionLocalUser(baseInput);
        expect(r.id).toBe("u1");
        expect(updateSet).not.toHaveBeenCalled();
    });

    it("accepts null username and null image", async () => {
        findFirst.mockResolvedValueOnce(undefined);
        findFirst.mockResolvedValueOnce(undefined);
        insert.mockReturnValueOnce({ returning: () => Promise.resolve([{ id: "u-new" }]) });
        const r = await provisionLocalUser({ ...baseInput, username: null, image: null });
        expect(r.id).toBe("u-new");
        const inserted = insert.mock.calls[0][0];
        expect(inserted).toMatchObject({ username: null, imageUrl: null });
    });
});