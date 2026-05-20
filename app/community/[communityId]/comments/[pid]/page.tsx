import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import {
  getCommunityDataAction,
  getPostAction,
  getCommentsAction,
} from "@/app/actions/reads";
import { notFound } from "next/navigation";
import PostClientPage from "./PostClientPage";

/**
 * A server-side page component for viewing a single post and its comments.
 * Prefetches community, post, and comment data into the React Query cache.
 * Validates existence and handles 404s.
 * @param params - The dynamic route parameters containing the community ID and post ID.
 * @returns The client-side post detail page wrapped in a Hydration Boundary.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ communityId: string; pid: string }>;
}) {
  const { communityId, pid } = await params;
  const queryClient = getQueryClient();

  let communityData;
  let postData;

  try {
    // We use fetchQuery for data we need to validate (community and post)
    // We use prefetchQuery for comments since their absence doesn't trigger a 404
    const [fetchedCommunity, fetchedPost] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: keys.community.detail(communityId),
        queryFn: () => getCommunityDataAction(communityId),
      }),
      queryClient.fetchQuery({
        queryKey: keys.posts.detail(pid),
        queryFn: () => getPostAction(pid),
      }),
      queryClient.prefetchQuery({
        queryKey: keys.comments.forPost(pid),
        queryFn: () => getCommentsAction(pid),
      }),
    ]);

    communityData = fetchedCommunity;
    postData = fetchedPost;
  } catch (error) {
    console.log("Error: PostPage", error);
    return <div>Error loading page</div>;
  }

  // Ensure both the community and the post exist before rendering
  if (!communityData || !postData) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* 
        Note: PostClientPage now takes IDs instead of the raw data.
        Update the client component to use `useQuery` to retrieve these from the cache.
      */}
      <PostClientPage communityId={communityId} postId={pid} />
    </HydrationBoundary>
  );
}