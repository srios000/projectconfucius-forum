import CommunitySettingsTabs from "@/components/community-settings/CommunitySettingsTabs";

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function Page({ params }: Props) {
  const { communityId } = await params;
  return <CommunitySettingsTabs communityId={communityId} />;
}
