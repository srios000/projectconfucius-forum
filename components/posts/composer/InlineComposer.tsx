"use client";
import { useReducer, useRef, useEffect, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bold, Italic, Underline, Strikethrough,
  Code, Link as LinkIcon, Unlink, Image as ImageIcon,
  List, Quote,
} from "lucide-react";
import { composerReducer, initialComposerState } from "@/lib/composer/state";
import { useCreatePostMutation } from "@/lib/queries/posts/use-create-post";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

type Props = { communityId: string };

type ToolbarButtonProps = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

function ToolbarButton({ label, Icon, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="size-7 rounded hover:bg-primary-mute hover:text-primary inline-flex items-center justify-center text-muted-foreground transition-colors"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export default function InlineComposer({ communityId }: Props) {
  const [s, dispatch] = useReducer(composerReducer, initialComposerState);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [pendingSelection, setPendingSelection] = useState<[number, number] | null>(null);
  const { data: session } = useSession();
  const create = useCreatePostMutation();

  const submit = async () => {
    if (!s.title.trim()) return;
    dispatch({ type: "SUBMIT" });
    try {
      await create.mutateAsync({ communityId, title: s.title.trim(), body: s.body });
      dispatch({ type: "SUBMIT_OK" });
    } catch (e) {
      dispatch({ type: "SUBMIT_ERROR", message: (e as Error).message });
    }
  };

  useEffect(() => { if (s.phase === "open") titleRef.current?.focus(); }, [s.phase]);

  useLayoutEffect(() => {
    if (pendingSelection && bodyRef.current) {
      bodyRef.current.focus();
      bodyRef.current.setSelectionRange(pendingSelection[0], pendingSelection[1]);
      setPendingSelection(null);
    }
  }, [pendingSelection, s.body]);

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

  const wrap = (left: string, right: string = left) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = s.body.slice(start, end);
    const next = s.body.slice(0, start) + left + sel + right + s.body.slice(end);
    dispatch({ type: "SET_BODY", body: next });
    setPendingSelection([start + left.length, end + left.length]);
  };

  const prefixLines = (prefix: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = s.body.lastIndexOf("\n", start - 1) + 1;
    const before = s.body.slice(0, lineStart);
    const block = s.body.slice(lineStart, end);
    const after = s.body.slice(end);
    const prefixed = block.length === 0 ? prefix : block.replace(/^/gm, prefix);
    const next = before + prefixed + after;
    dispatch({ type: "SET_BODY", body: next });
    const added = prefixed.length - block.length;
    setPendingSelection([start + prefix.length, end + added]);
  };

  const insertLink = () => {
    const url = window.prompt("URL");
    if (!url) return;
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = s.body.slice(start, end) || "link";
    const inserted = `[${text}](${url})`;
    const next = s.body.slice(0, start) + inserted + s.body.slice(end);
    dispatch({ type: "SET_BODY", body: next });
    setPendingSelection([start + 1, start + 1 + text.length]);
  };

  const removeLink = () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s.body))) {
      if (cursor >= m.index && cursor <= m.index + m[0].length) {
        const next = s.body.slice(0, m.index) + m[1] + s.body.slice(m.index + m[0].length);
        dispatch({ type: "SET_BODY", body: next });
        setPendingSelection([m.index, m.index + m[1].length]);
        return;
      }
    }
  };

  const insertImage = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const alt = s.body.slice(start, end) || "image";
    const inserted = `![${alt}](${url})`;
    const next = s.body.slice(0, start) + inserted + s.body.slice(end);
    dispatch({ type: "SET_BODY", body: next });
    setPendingSelection([start + 2, start + 2 + alt.length]);
  };

  const initials = (session?.user?.name ?? "?").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();

  const onBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    if (e.key === "b") { e.preventDefault(); wrap("**"); }
    else if (e.key === "i") { e.preventDefault(); wrap("*"); }
    else if (e.key === "k") { e.preventDefault(); insertLink(); }
  };

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
          Start a discussion in <strong className="text-foreground">c/{communityId}</strong>…
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
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-y border-border bg-muted/30">
              <ToolbarButton label="Bold (Ctrl+B)"   Icon={Bold}          onClick={() => wrap("**")} />
              <ToolbarButton label="Italic (Ctrl+I)" Icon={Italic}        onClick={() => wrap("*")} />
              <ToolbarButton label="Underline"       Icon={Underline}     onClick={() => wrap("<u>", "</u>")} />
              <ToolbarButton label="Strikethrough"   Icon={Strikethrough} onClick={() => wrap("~~")} />
              <ToolbarButton label="Inline code"     Icon={Code}          onClick={() => wrap("`")} />
              <ToolbarButton label="Link (Ctrl+K)"   Icon={LinkIcon}      onClick={insertLink} />
              <ToolbarButton label="Remove link"     Icon={Unlink}        onClick={removeLink} />
              <ToolbarButton label="Image"           Icon={ImageIcon}     onClick={insertImage} />
              <ToolbarButton label="Bulleted list"   Icon={List}          onClick={() => prefixLines("- ")} />
              <ToolbarButton label="Quote"           Icon={Quote}         onClick={() => prefixLines("> ")} />
            </div>
            <div className="px-3.5 py-3">
              <textarea
                ref={bodyRef}
                value={s.body}
                onChange={(e) => dispatch({ type: "SET_BODY", body: e.target.value })}
                onKeyDown={onBodyKeyDown}
                placeholder="What's on your mind? Markdown supported."
                rows={6}
                className="w-full bg-muted border border-border rounded-md px-3 py-2.5 text-[13px] outline-none focus:border-primary focus:bg-card transition-colors resize-none font-mono"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                <span>Posting to <strong className="text-primary">c/{communityId}</strong></span>
                <span className={s.title.length > 250 ? "text-destructive" : ""}>{s.title.length} / 300</span>
              </div>
              {s.error && <div className="text-[11px] text-destructive mt-1">{s.error}</div>}
            </div>
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
