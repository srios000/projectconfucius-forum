// app/page.tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queries/client";
import { keys } from "@/lib/queries/keys";
import { getPostsAction } from "@/app/actions/reads";
import HomePageClient from "./HomePageClient";

/**
 * The main landing page of the application.
 * Displays a personalized feed of posts for authenticated users or a generic popular feed for guests.
 * Includes a sidebar with community recommendations and personal shortcuts.
 * @returns The home page component with infinite scrolling posts.
 */
export default async function Home() {
  const queryClient = getQueryClient();
  // const session = await auth();
  // const isGenericHome = !session?.user;

  await queryClient.prefetchInfiniteQuery({
    queryKey: keys.posts.infiniteFeed({ isGenericHome: true }),
    queryFn: () => getPostsAction(undefined, undefined, true, null),
    initialPageParam: null,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePageClient />
    </HydrationBoundary>
  );
}