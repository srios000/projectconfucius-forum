"use client";

import { useEffect, useState } from "react";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { useSearchQuery } from "@/lib/queries/search/use-search";

const EMPTY = { communities: [] as Community[], posts: [] as Post[] };

/**
 * A custom hook that handles search for communities and posts.
 * It queries the server (debounced) as the user types and returns the matches.
 * @param searchTerm - The current string being searched for.
 * @returns An object containing the search results and a loading state indicator.
 */
const useSearch = (searchTerm: string) => {
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- debounce timer reset on empty input
      setDebounced("");
      return;
    }
    const handle = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const query = useSearchQuery({ term: debounced });

  return {
    results: query.data ?? EMPTY,
    loading: query.isFetching && debounced.length > 0,
  };
};

export default useSearch;