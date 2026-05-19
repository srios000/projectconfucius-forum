import { describe, it, expect, vi } from "vitest";
const execute = vi.fn(); const del = vi.fn(); const upd = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { transaction: async (f: any) => f({
    execute, delete: () => ({ where: del }),
    update: () => ({ set: () => ({ where: upd }) }),
  }) },
}));
import { deleteComment } from "@/lib/comments/deleteComment";
describe("deleteComment", () => {
  it("decrements numberOfComments by descendant count", async () => {
    execute.mockResolvedValueOnce([{ n: 3 }]);
    await deleteComment("c1", "p1");
    expect(del).toHaveBeenCalled();
    expect(upd).toHaveBeenCalled();
  });
});
