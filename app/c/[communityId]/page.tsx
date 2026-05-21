import CommunityClientPage from "@/app/community/[communityId]/comments/CommunityClientPage";

type Props = { params: Promise<{ communityId: string }> };

export default async function CommunityRoute({ params }: Props) {
  const { communityId } = await params;
  return <CommunityClientPage communityId={communityId} />;
}
