import { getCommunityData } from "@/lib/community/getCommunityData";
import { getPost } from "@/lib/post/getPost";
import { notFound } from "next/navigation";
import PostClientPage from "./PostClientPage";

/**
 * Server component that fetches community and post data for the comments route.
 * @param params - Route params containing community and post ids.
 * @returns Client comment page or an error/not-found fallback.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ communityId: string; pid: string }>;
}) {
  const { communityId, pid } = await params;

  let communityData;
  let postData;

  try {
    communityData = await getCommunityData(communityId);
    postData = await getPost(pid);

    if (!communityData) {
      notFound();
    }
  } catch (error) {
    console.log("Error: PostPage", error);
    return <div>Error loading page</div>;
  }

  return <PostClientPage communityData={communityData} postData={postData} />;
}
