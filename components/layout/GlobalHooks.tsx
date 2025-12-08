"use client";
import { auth } from "@/firebase/clientApp";
import { useCommunitySnippets } from "@/hooks/community/useCommunitySnippets";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

/**
 * Runs global data bootstrapping for community snippets and saved posts.
 * @returns Null render; side effects hydrate atoms based on auth state.
 */
const GlobalHooks: React.FC = () => {
  useCommunitySnippets();
  const { fetchSavedPosts, setSavedPostState } = useSavedPosts();
  const [user] = useAuthState(auth);

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
