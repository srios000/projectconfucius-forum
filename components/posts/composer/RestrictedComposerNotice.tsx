import { Button } from "@/components/ui/button";

export default function RestrictedComposerNotice({ communityId }: { communityId: string }) {
  return (
    <div className="bg-muted/40 border border-dashed border-border rounded-xl px-4 py-3.5 mb-2 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">
        Members only — join c/{communityId} to post.
      </span>
      <Button size="sm" variant="outline">Join</Button>
    </div>
  );
}
