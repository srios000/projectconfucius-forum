import SubThreadView from "@/components/posts/post-detail/SubThreadView";

type Props = { params: Promise<{ communityId: string; pid: string; cid: string }> };

export default async function SubThreadRoute({ params }: Props) {
  const { communityId, pid, cid } = await params;
  return <SubThreadView communityId={communityId} postId={pid} rootCommentId={cid} />;
}
