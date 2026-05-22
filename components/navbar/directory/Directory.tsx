"use client";

import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useActiveCommunity } from "@/hooks/community/useActiveCommunity";
import Communities from "./Communities";
import { ChevronDown, Home } from "lucide-react";
import Link from "next/link";

export default function Directory() {
  const { community } = useActiveCommunity();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 hidden md:flex">
          {community ? (
            <>
              <div
                className="size-5 rounded-full"
                style={{
                  background: community.imageUrl
                    ? `url(${community.imageUrl}) center/cover`
                    : "linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))",
                }}
              />
              <span>c/{community.id}</span>
            </>
          ) : (
            <>
              <Home className="size-4" />
              <span>Home</span>
            </>
          )}
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem asChild>
          <Link href="/" className="gap-2"><Home className="size-4" /> Home</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Your communities
        </DropdownMenuLabel>
        <Communities />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
