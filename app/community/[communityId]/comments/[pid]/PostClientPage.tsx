"use client";

import { uiAtom } from "@/atoms/uiAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import useCommunityState from "@/hooks/community/useCommunityState";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { Stack } from "@chakra-ui/react";
import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useState } from "react";

type PostPageProps = {
  communityId: string;
  postId: string;
};

const PostPage: React.FC<PostPageProps> = ({ communityId, postId }) => {
  const { data: communityData } = useCommunityDataQuery({ communityId });
  const { data: postData } = usePostQuery({ postId });
  const selectedPost = useAtomValue(uiAtom).selectedPost;
  const [, setUi] = useAtom(uiAtom);

  const [posts, setPosts] = useState<Post[]>([]);
  const { postVotes, setPostVotes } = usePostVoteSync();
  const { onVote, isVotePending } = usePostVote({
    posts,
    setPosts,
    postVotes,
    setPostVotes,
  });
  const { onDeletePost } = usePostDeletion({ posts, setPosts });

  const { communityStateValue, setCommunityStateValue } = useCommunityState();
  const fallbackCommunity = (communityData ?? { id: communityId }) as Community;
  const currentCommunity =
    communityStateValue.currentCommunity ?? fallbackCommunity;
  const { isAdmin, canView, canPost, loading } =
    useCommunityPermissions(currentCommunity);
  const { data: session } = useSession();
  const user = session?.user ?? null;

  useEffect(() => {
    if (communityData) {
      setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: communityData as Community,
      }));
    }
  }, [communityData, setCommunityStateValue]);

  useEffect(() => {
    if (postData) {
      setUi((prev) => ({ ...prev, selectedPost: postData as Post }));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror SSR-hydrated post into local posts list for vote/delete handlers
      setPosts([postData as Post]);
    }
  }, [postData, setUi]);

  if (loading || !communityData) {
    return (
      <PageContent>
        <PostLoader />
        <></>
      </PageContent>
    );
  }

  if (!canView) {
    return (
      <PageContent>
        <RestrictedCommunityBanner />
        <></>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <>
        <Stack gap={4}>
          {selectedPost && (
            <PostItem
              post={selectedPost}
              onVote={onVote}
              isVotePending={isVotePending(selectedPost.id!)}
              onDeletePost={onDeletePost}
              userVoteValue={
                postVotes.find((item) => item.postId === selectedPost.id)
                  ?.voteValue
              }
              userIsCreator={false}
              userIsAdmin={isAdmin}
              votingDisabled={!canPost}
            />
          )}
          <Comments
            user={user}
            selectedPost={selectedPost}
            communityId={selectedPost?.communityId as string}
            isCommunityAdmin={isAdmin}
          />
        </Stack>
      </>
      <>
        <About communityData={communityData as Community} />
      </>
    </PageContent>
  );
};

export default PostPage;
