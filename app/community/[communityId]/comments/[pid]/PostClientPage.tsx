"use client";

import { communityStateAtom } from "@/atoms/communitiesAtom";
import About from "@/components/community/about/About";
import PageContent from "@/components/layout/PageContent";
import PostLoader from "@/components/loaders/post-loader/PostLoader";
import Comments from "@/components/posts/comments/Comments";
import PostItem from "@/components/posts/post-item/PostItem";
import { useSession } from "@/lib/auth-client";
import useCommunityPermissions from "@/hooks/community/useCommunityPermissions";
import usePostDeletion from "@/hooks/posts/usePostDeletion";
import usePostState from "@/hooks/posts/usePostState";
import usePostVote from "@/hooks/posts/usePostVote";
import usePostVoteSync from "@/hooks/posts/usePostVoteSync";
import RestrictedCommunityBanner from "@/components/community/RestrictedCommunityBanner";
import { useCommunityDataQuery } from "@/lib/queries/community/use-community-data";
import { usePostQuery } from "@/lib/queries/posts/use-post";
import { Community } from "@/types/community";
import { Post } from "@/types/post";
import { Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";

type PostPageProps = {
  communityId: string;
  postId: string;
};

const PostPage: React.FC<PostPageProps> = ({ communityId, postId }) => {
  const { data: communityData } = useCommunityDataQuery({ communityId });
  const { data: postData } = usePostQuery({ postId });

  const { postStateValue, setPostStateValue } = usePostState();
  const { onVote } = usePostVote(postStateValue, setPostStateValue);
  const { onDeletePost } = usePostDeletion(setPostStateValue);
  usePostVoteSync(setPostStateValue);

  const [communityStateValue, setCommunityStateValue] =
    useAtom(communityStateAtom);
  const fallbackCommunity = (communityData ?? {
    id: communityId,
  }) as Community;
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
      setPostStateValue((prev) => ({
        ...prev,
        selectedPost: postData as Post,
      }));
    }
  }, [postData, setPostStateValue]);

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
          {postStateValue.selectedPost && (
            <PostItem
              post={postStateValue.selectedPost}
              onVote={onVote}
              onDeletePost={onDeletePost}
              userVoteValue={
                postStateValue.postVotes.find(
                  (item) => item.postId === postStateValue.selectedPost!.id
                )?.voteValue
              }
              userIsCreator={false}
              userIsAdmin={isAdmin}
              votingDisabled={!canPost}
            />
          )}
          <Comments
            user={user}
            selectedPost={postStateValue.selectedPost}
            communityId={postStateValue.selectedPost?.communityId as string}
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
