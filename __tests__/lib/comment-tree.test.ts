import { describe, it, expect } from "vitest";
import { countDescendants, shouldCutoff, MAX_INLINE_DEPTH, buildCommentTree } from "@/lib/utils/comment-tree";

type C = { id: string; children?: C[] };

describe("comment-tree", () => {
  it("countDescendants returns total nested count", () => {
    const tree: C = { id: "a", children: [
      { id: "b", children: [{ id: "c" }] },
      { id: "d" },
    ]};
    expect(countDescendants(tree)).toBe(3);
  });

  it("countDescendants returns 0 for leaf", () => {
    expect(countDescendants({ id: "x" })).toBe(0);
  });

  it("shouldCutoff true at MAX_INLINE_DEPTH and beyond", () => {
    expect(shouldCutoff(MAX_INLINE_DEPTH - 1)).toBe(false);
    expect(shouldCutoff(MAX_INLINE_DEPTH)).toBe(true);
    expect(shouldCutoff(MAX_INLINE_DEPTH + 3)).toBe(true);
  });

  it("MAX_INLINE_DEPTH is 5", () => {
    expect(MAX_INLINE_DEPTH).toBe(5);
  });

  it("buildCommentTree assembles parent→children", () => {
    const tree = buildCommentTree([
      { id: "a", parentId: null },
      { id: "b", parentId: "a" },
      { id: "c", parentId: "b" },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("b");
    expect(tree[0].children[0].children[0].id).toBe("c");
  });
});
