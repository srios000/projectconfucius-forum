"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import useSavedPosts from "@/hooks/posts/useSavedPosts";
import ConfirmationDialog from "@/components/modal/ConfirmationDialog";
import VoteSection from "./VoteSection";
import PostDetails from "./PostDetails";
import PostTitle from "./PostTitle";
import PostBody from "./PostBody";
import PostActions from "./PostActions";

type Props = {
  post: Post;
  userIsCreator: boolean;
  userIsAdmin?: boolean;
  userVoteValue?: number;
  onVote: (e: React.MouseEvent<SVGElement>, post: Post, vote: number, communityId: string) => void;
  onDeletePost: (post: Post) => Promise<boolean>;
  onSelectPost?: (post: Post) => void;
  showCommunityImage?: boolean;
  votingDisabled?: boolean;
  isVotePending?: boolean;
};

export default function PostItem({
  post, userIsCreator, userIsAdmin = false, userVoteValue, onVote, onDeletePost,
  onSelectPost, showCommunityImage, votingDisabled, isVotePending,
}: Props) {
  const [loadingImage, setLoadingImage] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const showToast = useCustomToast();
  const { onSavePost, isPostSaved } = useSavedPosts();
  const isSaved = isPostSaved(post.id!);
  const singlePostPage = !onSelectPost;
  const href = `/c/${post.communityId}/posts/${post.id}`;

  const [glow, setGlow] = useState(false);
  useEffect(() => {
    const recent = sessionStorage.getItem("pcf:newPost");
    if (recent && recent === post.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGlow(true);
      sessionStorage.removeItem("pcf:newPost");
      const t = setTimeout(() => setGlow(false), 3100);
      return () => clearTimeout(t);
    }
  }, [post.id]);

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoadingDelete(true);
    try {
      const ok = await onDeletePost(post);
      if (!ok) throw new Error("delete failed");
      showToast({ title: "Post deleted", status: "success" });
      if (singlePostPage) {
        if (post.communityId) {
          router.push(`/c/${post.communityId}`);
        } else {
          router.push("/");
        }
      }
    } catch {
      showToast({ title: "Couldn't delete the post", status: "error" });
    } finally {
      setLoadingDelete(false);
      setConfirmOpen(false);
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    await onSavePost(post);
  };

  return (
    <article
      className={`group bg-card border border-border rounded-xl flex gap-3 p-3 shadow-sm hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.25)] transition-all ${
        glow ? "new-post-glow" : ""
      }`}
      style={{
        // shared element name for view-transition morph
        viewTransitionName: `post-${post.id}`,
      }}
    >
      <div style={{ viewTransitionName: `vote-${post.id}` }}>
        <VoteSection
          userVoteValue={userVoteValue}
          onVote={onVote}
          post={post}
          votingDisabled={votingDisabled}
          isVotePending={isVotePending}
        />
      </div>
      <div className="flex-1 min-w-0">
        <PostDetails post={post} showCommunityImage={showCommunityImage} />
        {onSelectPost ? (
          <div onClick={() => onSelectPost(post)} className="cursor-pointer">
            <div style={{ viewTransitionName: `title-${post.id}` }}>
              <PostTitle post={post} />
            </div>
            <PostBody post={post} loadingImage={loadingImage} setLoadingImage={setLoadingImage} />
          </div>
        ) : (
          <div>
            <div style={{ viewTransitionName: `title-${post.id}` }}>
              <PostTitle post={post} />
            </div>
            <PostBody post={post} loadingImage={loadingImage} setLoadingImage={setLoadingImage} />
          </div>
        )}
        <PostActions
          handleDelete={handleDeleteClick}
          loadingDelete={loadingDelete}
          userIsCreator={userIsCreator}
          userIsAdmin={userIsAdmin}
          postLink={href}
          handleSave={handleSave}
          isSaved={isSaved}
          showToast={showToast}
        />
        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete post?"
          body="This can't be undone."
          confirmButtonText="Delete"
          isLoading={loadingDelete}
        />
      </div>
    </article>
  );
}

