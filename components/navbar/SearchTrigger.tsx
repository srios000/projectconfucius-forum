"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import SearchPalette from "./SearchPalette";

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 max-w-[360px] hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full
          bg-muted border border-border text-muted-foreground text-xs
          hover:border-primary-soft hover:bg-card transition-colors"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search communities, posts, people…</span>
        <kbd className="bg-card border border-border rounded px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
      <SearchPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
