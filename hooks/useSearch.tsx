import { useState, useEffect } from "react";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { getSearchData } from "@/lib/search/getSearchData";

/**
 * Client-side search hook that preloads public communities and recent posts.
 * @param searchTerm - Text input from the search field.
 * @returns Filtered communities and posts along with a loading flag.
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
  const [allData, setAllData] = useState<{
    communities: Community[];
    posts: Post[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { communities, posts } = await getSearchData();
        setAllData({ communities, posts });
      } catch (error) {
        console.error("Error fetching search data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!allData || !searchTerm) {
      setResults({ communities: [], posts: [] });
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();

    const filteredCommunities = allData.communities.filter((comm) =>
      comm.id.toLowerCase().includes(lowerTerm)
    );

    const filteredPosts = allData.posts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerTerm) ||
        post.body.toLowerCase().includes(lowerTerm)
    );

    setResults({
      communities: filteredCommunities,
      posts: filteredPosts,
    });
  }, [searchTerm, allData]);

  return { results, loading: loading && !allData };
};

export default useSearch;
