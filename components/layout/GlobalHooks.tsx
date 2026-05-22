"use client";
import { useCommunitySnippets } from "@/hooks/community/useCommunitySnippets";
import { useSavedPostsQuery } from "@/lib/queries/posts/use-saved-posts";
import React from "react";

const GlobalHooks: React.FC = () => {
  useCommunitySnippets();
  useSavedPostsQuery();
  return null;
};
export default GlobalHooks;
