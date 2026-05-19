import { describe, it, expect } from "vitest";
import * as schema from "@/lib/db/schema";

describe("forum schema", () => {
    it("exposes all domain tables", () => {
        for (const t of ["users", "communities", "communityMembers", "posts", "comments", "postVotes", "savedPosts"]) {
            expect(schema[t as keyof typeof schema]).toBeDefined();
        }
    });
    it("posts has denormalized counters", () => {
        expect(schema.posts.voteStatus).toBeDefined();
        expect(schema.posts.numberOfComments).toBeDefined();
    });
});