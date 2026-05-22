"use client";

import type { ReactNode, JSX } from "react";
import { cn } from "@/lib/utils";

type Mark = { type: string; attrs?: Record<string, unknown> };
type TipNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipNode[];
  text?: string;
  marks?: Mark[];
};

const isSafeUrl = (raw: string): boolean => {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
};

function renderMarks(text: string, marks: Mark[] | undefined, key: string): ReactNode {
  let node: ReactNode = text;
  if (!marks || marks.length === 0) return <span key={key}>{node}</span>;
  marks.forEach((m, i) => {
    const k = `${key}-m${i}`;
    switch (m.type) {
      case "bold":      node = <strong key={k}>{node}</strong>; break;
      case "italic":    node = <em key={k}>{node}</em>; break;
      case "underline": node = <u key={k}>{node}</u>; break;
      case "strike":    node = <s key={k}>{node}</s>; break;
      case "code":      node = <code key={k} className="bg-muted rounded-sm px-1 py-px font-mono text-[0.9em]">{node}</code>; break;
      case "link": {
        const href = typeof m.attrs?.href === "string" ? m.attrs.href : "";
        if (!isSafeUrl(href)) break;
        node = (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline underline-offset-2">
            {node}
          </a>
        );
        break;
      }
      default: break;
    }
  });
  return <span key={key}>{node}</span>;
}

function renderChildren(content: TipNode[] | undefined, key: string): ReactNode {
  if (!content) return null;
  return content.map((c, i) => renderNode(c, `${key}-${i}`));
}

function renderNode(node: TipNode, key: string): ReactNode {
  switch (node.type) {
    case "doc":
      return <>{renderChildren(node.content, key)}</>;
    case "paragraph":
      return <p key={key} className="my-1.5">{renderChildren(node.content, key)}</p>;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag key={key} className="font-serif font-semibold mt-3 mb-1.5">{renderChildren(node.content, key)}</Tag>;
    }
    case "bulletList":
      return <ul key={key} className="list-disc pl-5 my-1.5">{renderChildren(node.content, key)}</ul>;
    case "orderedList":
      return <ol key={key} className="list-decimal pl-5 my-1.5">{renderChildren(node.content, key)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node.content, key)}</li>;
    case "blockquote":
      return <blockquote key={key} className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">{renderChildren(node.content, key)}</blockquote>;
    case "codeBlock":
      return <pre key={key} className="bg-muted rounded-md p-2 my-2 overflow-x-auto"><code className="font-mono text-[0.9em]">{renderChildren(node.content, key)}</code></pre>;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!isSafeUrl(src)) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={key} src={src} alt={alt} className="rounded-lg my-2 max-w-full h-auto" />;
    }
    case "text":
      return renderMarks(node.text ?? "", node.marks, key);
    default:
      return null;
  }
}

function tryParseDoc(raw: string): TipNode | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      parsed && typeof parsed === "object" &&
      (parsed as { type?: unknown }).type === "doc" &&
      Array.isArray((parsed as { content?: unknown }).content)
    ) {
      return parsed as TipNode;
    }
    return null;
  } catch {
    return null;
  }
}

type Props = {
  /** Tiptap JSON doc (stringified) or legacy plain text. */
  body: string;
  className?: string;
  clamp?: boolean;
};

export default function RichTextView({ body, className, clamp }: Props) {
  if (!body) return null;
  const doc = tryParseDoc(body);

  if (!doc) {
    return (
      <div className={cn("whitespace-pre-wrap", clamp && "line-clamp-3", className)}>
        {body}
      </div>
    );
  }

  return (
    <div className={cn(clamp && "line-clamp-3", className)}>
      {renderNode(doc, "n")}
    </div>
  );
}
