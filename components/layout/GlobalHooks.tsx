"use client";
import { useCommunitySnippets } from "@/hooks/community/useCommunitySnippets";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import { useSession } from "@/lib/auth-client";
import React, { useEffect } from "react";

/**
 * A headless component that initializes global data based on the user's authentication state.
 * Bootstraps community subscriptions and saved posts into global state atoms.
 * @returns null, as this component only performs side effects.
 */
const GlobalHooks: React.FC = () => {
  useCommunitySnippets();
  const { fetchSavedPosts, setSavedPostState } = useSavedPosts();
  const { data: session } = useSession();
  const user = session?.user ?? null;

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    } else {
      setSavedPostState((prev) => ({
        ...prev,
        savedPosts: [],
        fetched: false,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return null;
};
export default GlobalHooks;
