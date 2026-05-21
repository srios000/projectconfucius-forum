"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";
import { usePostQuery } from "@/lib/queries/posts/use-post";

type Props = { postId: string; parentId: string | null; onDone?: () => void };

export default function InlineReplyComposer({ postId, parentId, onDone }: Props) {
  const [text, setText] = useState("");
  const create = useCreateCommentMutation();
  const { data: post } = usePostQuery({ postId });
  const submitting = create.isPending;

  const submit = async () => {
    if (!text.trim() || !post) return;
    try {
      await create.mutateAsync({
        communityId: post.communityId,
        postId,
        postTitle: post.title,
        commentText: text.trim(),
        parentId: parentId ?? undefined,
      });
      setText("");
      onDone?.();
    } catch (e) {
      console.error("Failed to submit comment:", e);
    }
  };

  return (
    <div className="bg-muted/40 border border-border rounded-lg p-2.5 mt-1.5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply…"
        rows={3}
        className="bg-transparent border-0 focus-visible:ring-0 resize-none p-0 text-[12.5px]"
      />
      <div className="flex justify-end gap-2 mt-1.5">
        {onDone && (
          <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        )}
        <Button size="sm" disabled={!text.trim() || submitting || !post} onClick={submit}>
          {submitting ? "Replying…" : "Reply"}
        </Button>
      </div>
    </div>
  );
}
