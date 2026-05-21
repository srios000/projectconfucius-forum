import { describe, it, expect } from "vitest";
import { buildCommentUrl } from "@/lib/utils/comment-url";

describe("buildCommentUrl", () => {
  it("builds the canonical sub-thread URL", () => {
    expect(buildCommentUrl("philosophy", "post-1", "cmt-99"))
      .toBe("/c/philosophy/posts/post-1/comment/cmt-99");
  });

  it("encodes URI-unsafe characters in the community id", () => {
    expect(buildCommentUrl("a b", "p", "c")).toBe("/c/a%20b/posts/p/comment/c");
  });

  it("throws if any segment is empty", () => {
    expect(() => buildCommentUrl("", "p", "c")).toThrow();
    expect(() => buildCommentUrl("c", "", "c")).toThrow();
    expect(() => buildCommentUrl("c", "p", "")).toThrow();
  });
});
