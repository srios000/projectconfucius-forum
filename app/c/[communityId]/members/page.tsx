import MembersList from "@/components/community/MembersList";

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function Page({ params }: Props) {
  const { communityId } = await params;
  return <MembersList communityId={communityId} />;
}
