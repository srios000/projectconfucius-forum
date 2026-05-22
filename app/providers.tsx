"use client";

import Layout from "@/components/layout/Layout";
import { QueryProvider } from "@/lib/queries/provider";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <Layout>{children}</Layout>
          <SonnerToaster richColors closeButton position="bottom-right" theme="system" />
        </ThemeProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}