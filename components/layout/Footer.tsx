"use client";

import Link from "next/link";

type FooterLink = { label: string; href: string };

const SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Communities", href: "/communities" },
      { label: "Saved", href: "/saved" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Settings", href: "/settings/general" },
      { label: "Profile", href: "/settings/profile" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Guidelines", href: "/guidelines" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mx-1.5 mb-1.5 rounded-2xl border border-border bg-card shadow-lg">
      <div className="mx-auto max-w-270 px-5 py-7">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div
                className="size-7 rounded-lg relative shadow-[0_2px_6px_-2px_hsl(var(--primary)/0.5),inset_0_1px_0_rgba(255,255,255,0.2)]"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-deep)))" }}
              >
                <div className="absolute inset-1.5 border-[1.5px] border-white/85 rounded" />
              </div>
              <span className="font-extrabold tracking-tight text-base">PCF</span>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-60">
              Project Confucius Forum — a space for considered discussion.
            </p>
            <p className="mt-3 font-serif text-lg text-primary" lang="zh">
              礼楽
            </p>
          </div>

          {/* Link columns */}
          {SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <div className="text-[10.5px] tracking-widest uppercase font-bold text-muted-foreground mb-2.5">
                {section.title}
              </div>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Project Confucius Forum. All rights reserved.</span>
          <span className="font-serif italic">礼楽 · Rites &amp; Music</span>
        </div>
      </div>
    </footer>
  );
}
