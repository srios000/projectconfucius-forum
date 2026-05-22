type FeedScope = {
    communityId?: string;
    communityIds?: string[];
    isGenericHome?: boolean;
    wallUserId?: string;
    sort?: string;
};


export const keys = {
    posts: {
        all: ["posts"] as const,
        infiniteFeed: (scope: FeedScope) => ["posts", "feed", scope] as const,
        detail: (id: string) => ["posts", "detail", id] as const,
        votes: (communityId: string | null) => ["posts", "votes", communityId ?? "__wall__"] as const,
        userVotes: (postIds: string[]) => ["posts", "user-votes", [...postIds].sort().join(",")] as const,
        saved: (userId: string) => ["posts", "saved", userId] as const,
    },
    community: {
        all: ["community"] as const,
        list: (args: { limit: number; cursor: unknown; sort?: string }) =>
            ["community", "list", args] as const,
        detail: (id: string) => ["community", "detail", id] as const,
        snippets: (userId: string) => ["community", "snippets", userId] as const,
        members: (id: string) => ["community", "members", id] as const,
        admins: (id: string) => ["community", "admins", id] as const,
    },
    comments: {
        forPost: (postId: string) => ["comments", postId] as const,
        votes: (postId: string) => ["comments", "votes", postId] as const,
    },
    admin: {
        search: (q: string) => ["admin", "search", q] as const,
    },
    search: (q: string) => ["search", q] as const,
    profile: (userId: string) => ["profile", userId] as const,
} as const;