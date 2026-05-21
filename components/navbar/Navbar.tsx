"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import SearchTrigger from "./SearchTrigger";
import RightContent from "./right-content/RightContent";
import Directory from "./directory/Directory";
import { ComposerLauncher } from "@/components/posts/composer/ComposerLauncher";
import MobileSidebarSheet from "@/components/layout/MobileSidebarSheet";

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-1 z-50 mx-1.5 mt-1.5 rounded-2xl border border-border bg-card shadow-lg">
      <div className="flex h-15.5 items-center gap-3 px-3">
        <MobileSidebarSheet />
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="size-7 rounded-lg relative shadow-[0_2px_6px_-2px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-deep)))" }}
          >
            <div className="absolute inset-1.5 border-[1.5px] border-white/85 rounded" />
          </div>
          <span className="hidden md:inline font-extrabold tracking-tight text-base">PCF</span>
        </Link>

        {user && <Directory />}
        <SearchTrigger />
        <ComposerLauncher />
        <RightContent user={user} loading={isPending} />
      </div>
    </header>
  );
}
