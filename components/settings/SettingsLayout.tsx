"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/settings/general", label: "General" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/saved",            label: "Saved posts" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-225 px-3 py-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <nav className="space-y-1 text-sm font-medium border-r border-border pr-4 h-fit">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md hover:bg-muted transition-colors ${
                active ? "text-primary font-semibold bg-muted/50" : "text-muted-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
