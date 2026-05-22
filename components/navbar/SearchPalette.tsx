"use client";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSearchQuery } from "@/lib/queries/search/use-search";

export default function SearchPalette({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const { data: results } = useSearchQuery({ term: q, enabled: q.length >= 2 });

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQ("");
    }
  }, [open]);

  const communitiesList = results?.communities ?? [];
  const postsList = results?.posts ?? [];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search communities and posts…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {communitiesList.length > 0 && (
          <CommandGroup heading="Communities">
            {communitiesList.map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => { router.push(`/c/${c.id}`); onOpenChange(false); }}
              >
                c/{c.id}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {postsList.length > 0 && (
          <CommandGroup heading="Posts">
            {postsList.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => { router.push(`/post/${p.id}`); onOpenChange(false); }}
              >
                <div className="flex flex-col truncate">
                  <span className="truncate">{p.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.communityId ? `c/${p.communityId}` : `u/${p.creatorUsername}`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
