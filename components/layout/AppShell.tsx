"use client";

import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export default function AppShell({
  children,
  withSidebar = true,
}: {
  children: React.ReactNode;
  withSidebar?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <main
        className={cn(
          "mx-auto max-w-[1080px] px-3 pb-12 pt-4",
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
    </div>
  );
}
