import CommunityClient from "./CommunityClient";

type Props = { params: Promise<{ communityId: string }> };

export default async function CommunityRoute({ params }: Props) {
  const { communityId } = await params;
  return <CommunityClient communityId={communityId} />;
}

