import { getCommunityData } from "@/lib/community/getCommunityData";
import { notFound } from "next/navigation";
import CommunityClientPage from "./comments/CommunityClientPage";

/**
 * Server component that loads community data and renders the client view.
 * @param params - Route params containing the community id.
 * @returns Community client page or a not-found/error fallback.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;

  let communityData;

  try {
    communityData = await getCommunityData(communityId);
  } catch (error) {
    console.log("Error: Page", error);
    return <div>Error loading community</div>;
  }

  if (!communityData) {
    notFound();
  }

  return <CommunityClientPage communityData={communityData} />;
}
