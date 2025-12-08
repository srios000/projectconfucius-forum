import { getCommunityData } from "@/lib/community/getCommunityData";
import { notFound } from "next/navigation";
import SubmitPostClientPage from "./SubmitPostClientPage";

/**
 * Server component that prepares data for the submit-post page of a community.
 * @param params - Route params containing the community id.
 * @returns Client submit page or an error/not-found fallback.
 */
export default async function SubmitPostPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;

  let communityData;

  try {
    communityData = await getCommunityData(communityId);

    if (!communityData) {
      notFound();
    }
  } catch (error) {
    console.log("Error: SubmitPostPage", error);
    return <div>Error loading community</div>;
  }

  return <SubmitPostClientPage communityData={communityData} />;
}
