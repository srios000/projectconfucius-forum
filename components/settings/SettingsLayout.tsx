"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProfileActive = pathname === "/settings/profile";
  const isSavedActive = pathname === "/saved";

  return (
    <div className="mx-auto max-w-[900px] px-3 py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <nav className="space-y-1 text-sm font-medium border-r border-border pr-4 h-fit">
        <Link
          href="/settings/profile"
          className={`block px-3 py-2 rounded-md hover:bg-muted transition-colors ${
            isProfileActive ? "text-primary font-semibold bg-muted/50" : "text-muted-foreground"
          }`}
        >
          Profile
        </Link>
        <Link
          href="/saved"
          className={`block px-3 py-2 rounded-md hover:bg-muted transition-colors ${
            isSavedActive ? "text-primary font-semibold bg-muted/50" : "text-muted-foreground"
          }`}
        >
          Saved posts
        </Link>
      </nav>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
