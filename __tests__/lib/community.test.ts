import { describe, it, expect, vi } from "vitest";
const insert = vi.fn(() => ({ values: () => ({ onConflictDoNothing: () => Promise.resolve() }) }));
const update = vi.fn(() => ({ set: () => ({ where: () => Promise.resolve() }) }));
vi.mock("@/lib/db", () => ({
  db: {
    transaction: async (f: any) => f({ insert, update }),
    query: { communityMembers: { findFirst: vi.fn(async () => undefined) } },
  },
}));
import { joinCommunity } from "@/lib/community/joinCommunity";
describe("joinCommunity", () => {
  it("inserts membership and bumps member count", async () => {
    await joinCommunity("u1", "c1");
    expect(insert).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});
