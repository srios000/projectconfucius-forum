"use client";
import AppShell from "./AppShell";
import GlobalHooks from "./GlobalHooks";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalHooks />
      <AppShell>{children}</AppShell>
    </>
  );
}
