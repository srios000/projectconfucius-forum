"use client";
import { useCommunitySnippets } from "@/hooks/useCommunitySnippets";
import React from "react";

const GlobalHooks: React.FC = () => {
  useCommunitySnippets();
  return null;
};
export default GlobalHooks;
