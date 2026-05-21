import { describe, it, expect, vi, beforeEach } from "vitest";
const execute = vi.fn();
const del = vi.fn();
const upd = vi.fn();
const ins = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    transaction: async (f: any) =>
      f({
        execute,
        delete: () => ({ where: del }),
        update: () => ({ set: () => ({ where: upd }) }),
        insert: () => ({ values: (row: unknown) => ins(row) }),
      }),
  },
}));
import { deleteComment } from "@/lib/comments/deleteComment";
import { createComment } from "@/lib/comments/createComment";

beforeEach(() => {
  execute.mockClear();
  del.mockClear();
  upd.mockClear();
  ins.mockClear();
});

describe("deleteComment", () => {
  it("decrements numberOfComments by descendant count", async () => {
    execute.mockResolvedValueOnce([{ n: 3 }]);
    await deleteComment("c1", "p1");
    expect(del).toHaveBeenCalled();
    expect(upd).toHaveBeenCalled();
  });
});

describe("createComment", () => {
  it("writes author.username verbatim to creatorDisplayText", async () => {
    await createComment(
      { id: "u1", username: "alice" },
      "c1",
      "p1",
      "title",
      "body",
    );
    expect(ins).toHaveBeenCalledTimes(1);
    expect(ins.mock.calls[0][0]).toMatchObject({
      creatorId: "u1",
      creatorDisplayText: "alice",
      communityId: "c1",
      postId: "p1",
      postTitle: "title",
      text: "body",
      depth: 0,
    });
  });

  it("writes null creatorDisplayText when username is null", async () => {
    await createComment(
      { id: "u1", username: null },
      "c1",
      "p1",
      "title",
      "body",
    );
    expect(ins.mock.calls[0][0]).toMatchObject({ creatorDisplayText: null });
  });
});
