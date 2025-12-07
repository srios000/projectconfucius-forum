import { getCommunityData } from "@/lib/community/getCommunityData";
import PostClientPage from "./PostClientPage";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/post/getPost";

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
