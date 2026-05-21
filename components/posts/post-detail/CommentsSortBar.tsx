"use client";
import { cn } from "@/lib/utils";

const SORTS = ["best", "new", "top", "controversial"] as const;
export type Sort = typeof SORTS[number];

type Props = { value: Sort; onChange: (v: Sort) => void };

export default function CommentsSortBar({ value, onChange }: Props) {
  return (
    <div className="mx-4 mb-2 flex items-center gap-1.5 rounded-lg bg-card border border-border p-1.5">
      <span className="text-xs text-muted-foreground mr-1.5">Sort by</span>
      {SORTS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors border-0 bg-transparent cursor-pointer",
            value === s ? "bg-primary-mute text-primary" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
