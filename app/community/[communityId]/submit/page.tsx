import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import { getCommunityDataAction } from "@/app/actions/reads";
import { notFound } from "next/navigation";
import SubmitPostClientPage from "./SubmitPostClientPage";

/**
 * A server-side page component for the post submission route.
 * Fetches the target community's data to ensure it exists, caches it via React Query,
 * and provides context for the submission form.
 * @param params - The dynamic route parameters containing the community ID.
 * @returns The client-side post submission page wrapped in a Hydration Boundary.
 */
export default async function SubmitPostPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;
  const queryClient = getQueryClient();

  let communityData;

  try {
    // We use fetchQuery so we can evaluate the result to handle 404s
    communityData = await queryClient.fetchQuery({
      queryKey: keys.community.detail(communityId),
      queryFn: () => getCommunityDataAction(communityId),
    });
  } catch (error) {
    console.log("Error: SubmitPostPage", error);
    return <div>Error loading community</div>;
  }

  if (!communityData) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* 
        Note: Update SubmitPostClientPage to accept `communityId: string` 
        instead of `communityData`, then use `useQuery` inside it.
      */}
      <SubmitPostClientPage communityId={communityId} />
    </HydrationBoundary>
  );
}