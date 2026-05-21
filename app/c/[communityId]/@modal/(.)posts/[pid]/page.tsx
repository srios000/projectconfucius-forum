"use client";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import PostDetail from "@/components/posts/post-detail/PostDetail";

export default function PostOverlayRoute() {
  const router = useRouter();
  const params = useParams<{ communityId: string; pid: string }>();
  
  if (!params.communityId || !params.pid) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) router.back(); }}>
      <DialogContent className="max-w-[760px] max-h-[88vh] overflow-y-auto p-0">
        <VisuallyHidden><DialogTitle>Post detail</DialogTitle></VisuallyHidden>
        <PostDetail
          communityId={params.communityId}
          postId={params.pid}
          layout="overlay"
        />
      </DialogContent>
    </Dialog>
  );
}
