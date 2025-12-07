import { getCommunityData } from "@/lib/community/getCommunityData";
import SubmitPostClientPage from "./SubmitPostClientPage";
import { notFound } from "next/navigation";

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
