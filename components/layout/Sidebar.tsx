"use client";
import { usePathname } from "next/navigation";
import SidebarHome from "./SidebarHome";
import SidebarCommunity from "./SidebarCommunity";

export default function Sidebar() {
  const path = usePathname() ?? "/";
  const match = path.match(/^\/c\/([^/]+)/);
  if (match) return <SidebarCommunity communityId={match[1]} />;
  return <SidebarHome />;
}
