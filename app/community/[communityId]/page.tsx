import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import {
  getCommunityDataAction,
  getPostsAction,
} from "@/app/actions/reads";
import { notFound } from "next/navigation";
import CommunityClientPage from "./comments/CommunityClientPage";

/**
 * A server-side page component that fetches data for a specific community.
 * Validates the community ID and handles error states or non-existent communities by showing a 404 page.
 * @param params - The dynamic route parameters containing the community ID.
 * @returns The client-side community page populated with server-fetched data.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;
  const queryClient = getQueryClient();

  let communityData;

  try {
    // We use fetchQuery for the community data so we can check its existence for the 404.
    // We prefetch the posts feed concurrently to avoid a waterfall.
    const [fetchedCommunity] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: keys.community.detail(communityId),
        queryFn: () => getCommunityDataAction(communityId),
      }),
      queryClient.prefetchQuery({
        queryKey: keys.posts.feed({
          scope: { communityId },
          cursor: null,
        }),
        queryFn: () => getPostsAction(communityId, undefined, false, null),
      }),
    ]);

    communityData = fetchedCommunity;
  } catch (error) {
    console.log("Error: Page", error);
    return <div>Error loading community</div>;
  }

  if (!communityData) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* 
        Note: The client component now takes communityId instead of communityData.
        You will need to update CommunityClientPage to use `useQuery` to pull 
        the data from the cache using this ID. 
      */}
      <CommunityClientPage communityId={communityId} />
    </HydrationBoundary>
  );
}