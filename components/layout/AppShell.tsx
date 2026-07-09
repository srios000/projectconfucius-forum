"use client";

import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import ImpersonationBanner from "@/components/layout/ImpersonationBanner";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const NO_SIDEBAR_PREFIXES = ["/settings", "/saved", "/guidelines", "/privacy", "/terms", "/posts"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const withSidebar = !NO_SIDEBAR_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <ImpersonationBanner />
      <Navbar />
      <main
        className={cn(
          "mx-auto w-full max-w-270 flex-1 px-3 pb-12 pt-4",
          withSidebar
            ? "grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]"
            : "grid grid-cols-1"
        )}
      >
        <div className="min-w-0">{children}</div>
        {withSidebar && (
          <aside className="hidden md:block">
            <Sidebar />
          </aside>
        )}
      </main>
      <Footer />
    </div>
  );
}
