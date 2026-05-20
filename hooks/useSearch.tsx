import { useState, useEffect } from "react";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { getSearchDataAction } from "@/app/actions/reads";

/**
 * A custom hook that handles search for communities and posts.
 * It queries the server (debounced) as the user types and returns the matches.
 * @param searchTerm - The current string being searched for.
 * @returns An object containing the search results and a loading state indicator.
 */
const useSearch = (searchTerm: string) => {
  const [results, setResults] = useState<{
    communities: Community[];
    posts: Post[];
  }>({
    communities: [],
    posts: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on empty-term prop change; TanStack Query migration tracked separately
      setResults({ communities: [], posts: [] });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const { communities, posts } = await getSearchDataAction(term);
        if (!cancelled) setResults({ communities, posts });
      } catch (error) {
        console.error("Error fetching search data", error);
        if (!cancelled) setResults({ communities: [], posts: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchTerm]);

  return { results, loading };
};

export default useSearch;
