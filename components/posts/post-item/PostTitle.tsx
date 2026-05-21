import { Post } from "@/types/post";

export default function PostTitle({ post }: { post: Post }) {
  return (
    <h3 className="font-serif font-semibold text-[17px] leading-snug tracking-[-0.005em] hover:text-primary transition-colors">
      {post.title}
    </h3>
  );
}
