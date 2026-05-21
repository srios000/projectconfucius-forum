"use client";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function Communities() {
  const { data: session } = useSession();
  const { data: snippets } = useCommunitySnippetsQuery();
  if (!snippets?.length) {
    return <DropdownMenuItem disabled>No communities yet</DropdownMenuItem>;
  }
  return (
    <>
      {snippets.map((s) => (
        <DropdownMenuItem key={s.communityId} asChild>
          <Link href={`/c/${s.communityId}`} className="gap-2.5">
            <div
              className="size-5 rounded-full shrink-0"
              style={{
                background: s.imageUrl
                  ? `url(${s.imageUrl}) center/cover`
                  : "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))",
              }}
            />
            <span className="truncate">c/{s.communityId}</span>
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}
