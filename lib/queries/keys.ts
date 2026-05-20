export type FeedArgs = {
    communityId?: string;
    communityIds?: string[];
    isGenericHome?: boolean;
};

export const keys = {
    posts: {
        all: ["posts"] as const,
        feed: (a: FeedArgs) => ["posts", "feed", a] as const,
        detail: (id: string) => ["posts", "detail", id] as const,
        votes: (userId: string) => ["posts", "votes", userId] as const,
        saved: (userId: string) => ["posts", "saved", userId] as const,
    },
    community: {
        all: ["community"] as const,
        list: (limit: number) => ["community", "list", limit] as const,
        detail: (id: string) => ["community", "detail", id] as const,
        snippets: (userId: string) => ["community", "snippets", userId] as const,
        members: (id: string) => ["community", "members", id] as const,
        admins: (id: string) => ["community", "admins", id] as const,
    },
    comments: {
        forPost: (postId: string) => ["comments", postId] as const,
    },
    admin: {
        search: (q: string) => ["admin", "search", q] as const,
    },
    search: (q: string) => ["search", q] as const,
    profile: (userId: string) => ["profile", userId] as const,
} as const;