"use client";
import Image from "next/image";
import { Post } from "@/types/post";
import { Skeleton } from "@/components/ui/skeleton";
import RichTextView from "@/components/editor/RichTextView";

type Props = {
  post: Post;
  loadingImage: boolean;
  setLoadingImage: (v: boolean) => void;
};

export default function PostBody({ post, loadingImage, setLoadingImage }: Props) {
  return (
    <>
      {post.body && (
        <RichTextView
          body={post.body}
          clamp
          className="text-[12.5px] text-muted-foreground leading-relaxed mt-1"
        />
      )}
      {post.imageUrl && (
        <div className="mt-2 relative">
          {loadingImage && <Skeleton className="h-48 w-full skel-jade rounded-lg" />}
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={720}
            height={480}
            className="rounded-lg w-full h-auto"
            onLoad={() => setLoadingImage(false)}
            style={{ display: loadingImage ? "none" : "block" }}
          />
        </div>
      )}
    </>
  );
}
