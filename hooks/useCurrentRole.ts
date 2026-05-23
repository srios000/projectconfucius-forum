"use client";

import { useSession } from "@/lib/auth-client";
import useCommunityState from "@/hooks/community/useCommunityState";
import { useMeQuery } from "@/lib/queries/profile/use-me";

const SUPERADMIN_ROLE = "forum-superadmin";

/**
 * Client-side role snapshot. Source of truth for authorization stays in
 * server actions; this is just for UI gating (showing/hiding controls).
 *
 * - userId: local users.id (from /me)
 * - isSuperadmin: derived from session.user.role (comma-separated)
 * - isModeratorOf(communityId): from community snippets
 */
export default function useCurrentRole() {
    const { data: session } = useSession();
    const { data: me } = useMeQuery();
    const { communityStateValue } = useCommunityState();

    const roleRaw = (session?.user as { role?: unknown } | undefined)?.role;
    const roles = typeof roleRaw === "string" && roleRaw
        ? roleRaw.split(",").map((r) => r.trim())
        : [];
    const isSuperadmin = roles.includes(SUPERADMIN_ROLE);

    const isModeratorOf = (communityId: string | null) =>
        !!communityId && !!communityStateValue.mySnippets.find(
            (s) => s.communityId === communityId && s.isModerator,
        );

    return {
        userId: me?.id ?? null,
        isSuperadmin,
        isModeratorOf,
    };
}
