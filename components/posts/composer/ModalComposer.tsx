"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import InlineComposer from "./InlineComposer";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function ModalComposer({ open, onOpenChange }: Props) {
  const { data: snippets } = useCommunitySnippetsQuery();
  const [selected, setSelected] = useState<string | null>(snippets?.[0]?.communityId ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] p-0">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-sm font-bold">New post</DialogTitle>
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            className="mt-2 bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs"
          >
            <option value="">— pick a community —</option>
            {(snippets ?? []).map((s) => (
              <option key={s.communityId} value={s.communityId}>c/{s.communityId}</option>
            ))}
          </select>
        </DialogHeader>
        {selected && <InlineComposer communityId={selected} />}
      </DialogContent>
    </Dialog>
  );
}
