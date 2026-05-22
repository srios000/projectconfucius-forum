"use client";
import { useState, useMemo } from "react";
import { useCommentsForPostQuery } from "@/lib/queries/comments/use-comments";
import { useCommentVotesQuery } from "@/lib/queries/comments/use-comment-votes";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { buildCommentTree } from "@/lib/utils/comment-tree";
import { CommentVote } from "@/lib/comments/getCommentVotes";
import CommentNode from "./CommentNode";
import CommentsSortBar, { Sort } from "./CommentsSortBar";
import InlineReplyComposer from "./InlineReplyComposer";

export default function Comments({ postId, communityId }: { postId: string; communityId: string | null }) {
  const [sort, setSort] = useState<Sort>("best");
  const { data: flatComments } = useCommentsForPostQuery({ postId });
  const { data: votes } = useCommentVotesQuery(postId);
  const { data: post } = usePostQuery({ postId });

  const comments = useMemo(() => {
    if (!flatComments) return [];
    const tree = buildCommentTree(flatComments);
    
    // Perform client-side sorting on root comments
    if (sort === "new") {
      return [...tree].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default to oldest first for reading threads chronologically
      return [...tree].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }, [flatComments, sort]);

  return (
    <div className="bg-background py-2">
      <CommentsSortBar value={sort} onChange={setSort} />
      <div className="px-4 mb-3">
        <InlineReplyComposer postId={postId} parentId={null} />
      </div>
      <div className="space-y-2 px-4 pb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-3">
            <CommentNode
              comment={c}
              depth={0}
              communityId={communityId}
              postId={postId}
              postAuthorId={post?.creatorId}
              votes={votes}
            />
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No comments yet. Be the first to reply!
          </div>
        )}
      </div>
    </div>
  );
}
