"use client";
import { useReducer, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { composerReducer, initialComposerState } from "@/lib/composer/state";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import RichTextEditor from "@/components/editor/RichTextEditor";

type Props = { communityId?: string; wallUserId?: string };

export default function InlineComposer({ communityId, wallUserId }: Props) {
  const [s, dispatch] = useReducer(composerReducer, initialComposerState);
  const titleRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const create = useCreatePostMutation();
  const target = wallUserId ? `u/${wallUserId}'s wall` : `c/${communityId}`;

  const submit = async () => {
    if (!s.title.trim()) return;
    dispatch({ type: "SUBMIT" });
    try {
      await create.mutateAsync({ communityId, wallUserId, title: s.title.trim(), body: s.body });
      dispatch({ type: "SUBMIT_OK" });
    } catch (e) {
      dispatch({ type: "SUBMIT_ERROR", message: (e as Error).message });
    }
  };

  useEffect(() => { if (s.phase === "open") titleRef.current?.focus(); }, [s.phase]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape" && s.phase !== "closed") dispatch({ type: "CANCEL" });
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && s.phase === "open" && s.title.trim()) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  });

  const initials = (session?.user?.name ?? "?").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      layout
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
      className={
        "bg-card border rounded-xl overflow-hidden mb-3 transition-colors " +
        (s.phase !== "closed"
          ? "border-primary-soft shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.18)]"
          : "border-border")
      }
    >
      <div className="flex items-center gap-3 px-3.5 py-3 cursor-text" onClick={() => dispatch({ type: "OPEN" })}>
        <Avatar className="size-8 shrink-0">
          {session?.user?.image && <AvatarImage src={session.user.image} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="flex-1 text-[12.5px] text-muted-foreground">
          Start a discussion in <strong className="text-foreground">{target}</strong>…
        </span>
      </div>

      <AnimatePresence initial={false}>
        {s.phase !== "closed" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
          >
            <div className="px-3.5 pt-3">
              <input
                ref={titleRef}
                value={s.title}
                onChange={(e) => dispatch({ type: "SET_TITLE", title: e.target.value })}
                placeholder="Title — be specific"
                maxLength={300}
                className="w-full bg-transparent border-0 outline-none font-serif text-[16px] font-semibold py-1.5"
              />
            </div>
            <RichTextEditor
              value={s.body}
              onChange={(html) => dispatch({ type: "SET_BODY", body: html })}
              placeholder="What's on your mind?"
              autoFocus={false}
            />
            <div className="px-3.5 pb-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Posting to <strong className="text-primary">{target}</strong></span>
              <span className={s.title.length > 250 ? "text-destructive" : ""}>{s.title.length} / 300</span>
            </div>
            {s.error && <div className="text-[11px] text-destructive px-3.5 pb-1">{s.error}</div>}
            <div className="flex justify-between items-center px-3.5 py-2.5 bg-muted/40 border-t border-border">
              <div className="text-[11px] text-muted-foreground">
                <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Ctrl</kbd>+
                <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Enter</kbd> to post
                {" · "}
                <kbd className="bg-card border border-border rounded px-1 py-px font-mono text-[10px]">Esc</kbd> to cancel
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "CANCEL" })}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={!s.title.trim() || s.phase === "submitting"}
                  onClick={submit}
                >
                  {s.phase === "submitting" ? "Posting…" : "Post"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
