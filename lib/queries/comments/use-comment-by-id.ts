"use client";

import { useMemo } from "react";
import { useCommentsForPostQuery } from "./use-comments";
import { buildCommentTree } from "@/lib/utils/comment-tree";
import type { Comment } from "@/types/comment";

export function useCommentByIdQuery({
    postId,
    commentId,
}: {
    postId: string;
    commentId: string;
}) {
    const { data: flatComments, ...rest } = useCommentsForPostQuery({ postId });

    const data = useMemo(() => {
        if (!flatComments) return null;
        const tree = buildCommentTree(flatComments);
        const findNode = (nodes: any[]): any | null => {
            for (const n of nodes) {
                if (n.id === commentId) return n;
                if (n.children) {
                    const found = findNode(n.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findNode(tree) as (Comment & { children?: Comment[] }) | null;
    }, [flatComments, commentId]);

    return { ...rest, data };
}
