import { describe, it, expect } from "vitest";
import { computeVoteDelta } from "@/lib/queries/posts/optimistic-helpers";
import type { PostVote } from "@/types/post";

describe("computeVoteDelta", () => {
    it("no existing vote: returns vote value as delta and creates new vote", () => {
        const r = computeVoteDelta({ vote: 1, postId: "p1", communityId: "c1", existing: undefined });
        expect(r.delta).toBe(1);
        expect(r.nextVote?.voteValue).toBe(1);
        expect(r.nextVote?.postId).toBe("p1");
        expect(r.deletedVoteId).toBeUndefined();
    });

    it("existing vote same direction: returns negated delta and marks for deletion", () => {
        const existing: PostVote = { id: "v1", postId: "p1", communityId: "c1", voteValue: 1 };
        const r = computeVoteDelta({ vote: 1, postId: "p1", communityId: "c1", existing });
        expect(r.delta).toBe(-1);
        expect(r.deletedVoteId).toBe("v1");
        expect(r.nextVote).toBeUndefined();
    });

    it("existing vote opposite direction: returns 2x delta and flips vote", () => {
        const existing: PostVote = { id: "v1", postId: "p1", communityId: "c1", voteValue: -1 };
        const r = computeVoteDelta({ vote: 1, postId: "p1", communityId: "c1", existing });
        expect(r.delta).toBe(2);
        expect(r.nextVote?.id).toBe("v1");
        expect(r.nextVote?.voteValue).toBe(1);
        expect(r.deletedVoteId).toBeUndefined();
    });
});

import type { InfiniteData } from "@tanstack/react-query";
import type { Post } from "@/types/post";
import { mapInfiniteFeedPost, removeFromInfiniteFeed } from "@/lib/queries/posts/optimistic-helpers";

type FeedPage = { posts: Post[]; newLastVisible: unknown };

const p = (id: string, voteStatus = 0): Post =>
    ({ id, communityId: "c1", title: id, voteStatus } as Post);

describe("mapInfiniteFeedPost", () => {
    it("returns undefined when input data is undefined", () => {
        expect(mapInfiniteFeedPost<FeedPage>(undefined, "p1", (post) => post)).toBeUndefined();
    });

    it("maps matching post across all pages, leaves non-matches", () => {
        const data: InfiniteData<FeedPage> = {
            pages: [
                { posts: [p("p1", 1), p("p2", 0)], newLastVisible: null },
                { posts: [p("p3", 0), p("p1", 1)], newLastVisible: null },
            ],
            pageParams: [null, null],
        };
        const out = mapInfiniteFeedPost(data, "p1", (post) => ({ ...post, voteStatus: post.voteStatus + 5 }));
        expect(out!.pages[0].posts[0].voteStatus).toBe(6);
        expect(out!.pages[0].posts[1].voteStatus).toBe(0);
        expect(out!.pages[1].posts[0].voteStatus).toBe(0);
        expect(out!.pages[1].posts[1].voteStatus).toBe(6);
    });
});

describe("removeFromInfiniteFeed", () => {
    it("returns undefined when input data is undefined", () => {
        expect(removeFromInfiniteFeed<FeedPage>(undefined, "p1")).toBeUndefined();
    });

    it("drops the matching post from every page", () => {
        const data: InfiniteData<FeedPage> = {
            pages: [
                { posts: [p("p1"), p("p2")], newLastVisible: null },
                { posts: [p("p3"), p("p1")], newLastVisible: null },
            ],
            pageParams: [null, null],
        };
        const out = removeFromInfiniteFeed(data, "p1");
        expect(out!.pages[0].posts.map((x) => x.id)).toEqual(["p2"]);
        expect(out!.pages[1].posts.map((x) => x.id)).toEqual(["p3"]);
    });
});
