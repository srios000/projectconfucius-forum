import { redirect } from "next/navigation";
import { getPost } from "@/lib/posts/getPost";
import ContentNotAvailable from "@/components/common/ContentNotAvailable";

type Props = { params: Promise<{ pid: string }> };

/**
 * Community-agnostic permalink for a post. Post ids are globally unique, so we
 * resolve the owning community from the id and redirect to the canonical
 * /c/[communityId]/posts/[pid] URL. Falls back to a not-available state when the
 * post (or its community) can't be resolved.
 */
export default async function PostRedirectRoute({ params }: Props) {
  const { pid } = await params;
  const post = await getPost(pid);

  if (post?.communityId) {
    redirect(`/c/${post.communityId}/posts/${pid}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-10">
      <ContentNotAvailable
        variant="notAvailable"
        title="Post not found"
        description="This post may have been removed, or the link is incorrect."
      />
    </div>
  );
}
