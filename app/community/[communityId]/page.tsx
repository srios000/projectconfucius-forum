import { getCommunityData } from "@/lib/communities";
import CommunityClientPage from "./CommunityClientPage";
import { notFound } from "next/navigation";

export default async function Page({
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
    console.log("Error: Page", error);
    return <div>Error loading community</div>;
  }

  return <CommunityClientPage communityData={communityData} />;
}
