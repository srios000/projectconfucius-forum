import { describe, it, expect } from "vitest";
import { keys } from "@/lib/queries/keys";

describe("queryKey factory", () => {
    it("posts.infiniteFeed produces stable tuple with args", () => {
        const a = keys.posts.infiniteFeed({ communityId: "c1", isGenericHome: false });
        const b = keys.posts.infiniteFeed({ communityId: "c1", isGenericHome: false });

        expect(a).toEqual(b);
        expect(a[0]).toBe("posts");
        expect(a[1]).toBe("feed");
    });

    it("posts.detail keyed by id", () => {
        expect(keys.posts.detail("p1")).toEqual(["posts", "detail", "p1"]);
    });

    it("community.detail keyed by id", () => {
        expect(keys.community.detail("c1")).toEqual(["community", "detail", "c1"]);
    });

    it("comments.forPost keyed by postId", () => {
        expect(keys.comments.forPost("p1")).toEqual(["comments", "p1"]);
    });

    it("posts.all is the top-level invalidation prefix", () => {
        expect(keys.posts.all).toEqual(["posts"]);
    });

    it("community.all is the top-level invalidation prefix", () => {
        expect(keys.community.all).toEqual(["community"]);
    });
});


describe("keys.posts.infiniteFeed", () => {
    it("returns ['posts','feed', scope] and matches feed predicate", () => {
        const k = keys.posts.infiniteFeed({ communityId: "c1" });
        expect(k[0]).toBe("posts");
        expect(k[1]).toBe("feed");
        expect(k[2]).toEqual({ communityId: "c1" });
    });

    it("two calls with the same scope shape produce equal keys", () => {
        const a = keys.posts.infiniteFeed({ communityIds: ["c1", "c2"] });
        const b = keys.posts.infiniteFeed({ communityIds: ["c1", "c2"] });
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
});
