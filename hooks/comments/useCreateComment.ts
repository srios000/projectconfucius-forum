import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { Post } from "@/types/post";
import useCustomToast from "@/hooks/useCustomToast";
import { useCommunitySnippetsQuery } from "@/lib/queries/community/use-community-snippets";
import { checkCommunityPermission } from "@/lib/community/communityPermissions";
import { useCreateCommentMutation } from "@/lib/queries/comments/use-create-comment-mutation";
import { getCommunityDataAction } from "@/app/actions/reads";
import type { Community } from "@/types/community";

const useCreateComment = (selectedPost: Post | null) => {
  const qc = useQueryClient();
  const showToast = useCustomToast();
  const [createLoading, setCreateLoading] = useState(false);
  const snippets = useCommunitySnippetsQuery();
  const mutation = useCreateCommentMutation();

  const onCreateComment = async (commentText: string, parentId?: string) => {
    if (!selectedPost) return;
    setCreateLoading(true);

    if (selectedPost.communityId) {
      const communityId = selectedPost.communityId;
      const cachedCommunity = qc.getQueryData<Community>(keys.community.detail(communityId));
      const community = cachedCommunity ?? (await qc.fetchQuery({
        queryKey: keys.community.detail(communityId),
        queryFn: () => getCommunityDataAction(communityId),
      }));
      if (community) {
        const hasPermission = checkCommunityPermission(community as Community, snippets.data ?? []);
        if (!hasPermission) {
          showToast({
            title: "Restricted Community",
            description: "You must be a member to comment in this community.",
            status: "error",
          });
          setCreateLoading(false);
          return;
        }
      }
    }

    try {
      await mutation.mutateAsync({
        communityId: selectedPost.communityId,
        postId: selectedPost.id!,
        postTitle: selectedPost.title,
        commentText,
        parentId,
      });
      qc.setQueryData<Post>(keys.posts.detail(selectedPost.id!), (old) =>
        old ? { ...old, numberOfComments: old.numberOfComments + 1 } : old,
      );
    } catch (error: any) {
      console.log("onCreateComment error", error);
      showToast({
        title: "Comment failed",
        description: error.message || "There was an error creating your comment",
        status: "error",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return { createComment: onCreateComment, createLoading };
};

export default useCreateComment;
