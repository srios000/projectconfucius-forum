import PostDetail from "@/components/posts/post-detail/PostDetail";

type Props = { params: Promise<{ communityId: string; pid: string }> };

export default async function PostDetailRoute({ params }: Props) {
  const { communityId, pid } = await params;
  return <PostDetail communityId={communityId} postId={pid} layout="page" />;
}
