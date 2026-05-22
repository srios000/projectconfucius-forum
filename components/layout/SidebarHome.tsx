"use client";

import { useSession } from "@/lib/auth-client";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Recommendations from "@/components/community/recommendations/Recommendations";
import PersonalHome from "@/components/community/PersonalHome";

export default function SidebarHome() {
  const { data: session } = useSession();
  const { data: snippets } = useCommunitySnippetsQuery();
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  return (
    <div className="space-y-3">
      {session?.user && (
        <Card title="Your communities">
          {(snippets ?? []).map((s) => (
            <Link
              key={s.communityId}
              href={`/c/${s.communityId}`}
              className="flex items-center gap-2.5 py-1.5 border-b border-border/60 last:border-0 hover:pl-1 transition-[padding] duration-200"
            >
              <div
                className="size-7 rounded-full shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                style={{
                  background: s.imageUrl
                    ? `url(${s.imageUrl}) center/cover`
                    : "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))",
                }}
              />
              <span className="text-sm font-semibold truncate">c/{s.communityId}</span>
            </Link>
          ))}
        </Card>
      )}
      <Recommendations />
      {isHome && <PersonalHome />}
      <CommunityQuoteCard />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5">
      <div className="text-[10.5px] tracking-widest uppercase font-bold text-muted-foreground mb-2.5">{title}</div>
      {children}
    </div>
  );
}

function CommunityQuoteCard() {
  return (
    <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary-mute to-card p-4 text-center">
      <p className="font-serif italic text-primary text-sm leading-snug">
        &ldquo;The unexamined life<br />is not worth living.&rdquo;
      </p>
      <p className="text-[10px] text-muted-foreground mt-1.5">— rotating community quote</p>
    </div>
  );
}
