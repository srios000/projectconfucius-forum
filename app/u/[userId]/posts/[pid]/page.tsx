import PostDetail from "@/components/posts/post-detail/PostDetail";

type Props = { params: Promise<{ userId: string; pid: string }> };

export default async function WallPostDetailRoute({ params }: Props) {
  const { userId, pid } = await params;
  return <PostDetail wallUserId={userId} postId={pid} layout="page" />;
}
