"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalComposer from "./ModalComposer";
import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";

export function ComposerLauncher() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const path = usePathname() ?? "/";
  // Only show on home or non-community routes (community pages have the inline composer)
  if (path.startsWith("/c/")) return null;
  if (!session?.user) return null;

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Create post">
        <Plus className="size-5" />
      </Button>
      <ModalComposer open={open} onOpenChange={setOpen} />
    </>
  );
}
