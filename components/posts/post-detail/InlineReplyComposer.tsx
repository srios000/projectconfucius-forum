"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import RichTextEditor from "@/components/editor/RichTextEditor";

type Props = { postId: string; parentId: string | null; onDone?: () => void };

export default function InlineReplyComposer({ postId, parentId, onDone }: Props) {
  const [text, setText] = useState("");
  // Lazy initial state covers both cases: nested replies always focus, and a
  // top-level composer focuses when the URL has #reply. No effect needed —
  // the hash is known at first render. `useState` only runs the initializer
  // once, so subsequent hash changes are intentionally ignored (matches the
  // prior behaviour).
  const [shouldFocus] = useState(
    () => !!parentId || (typeof window !== "undefined" && window.location.hash === "#reply"),
  );
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
    <div className="bg-card border border-border rounded-lg overflow-hidden mt-1.5 shadow-sm">
      <RichTextEditor
        value={text}
        onChange={setText}
        placeholder="What are your thoughts?"
        autoFocus={shouldFocus}
        onSubmit={submit}
      />
      <div className="flex justify-between items-center gap-2 bg-muted/20 px-3.5 py-2.5 border-t border-border">
        <div className="text-[11px] text-muted-foreground">
          <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Ctrl</kbd>+
          <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Enter</kbd> to reply
        </div>
        <div className="flex gap-2">
          {onDone && (
            <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
          )}
          <Button size="sm" disabled={!text.trim() || submitting || !post} onClick={submit}>
            {submitting ? "Replying…" : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
