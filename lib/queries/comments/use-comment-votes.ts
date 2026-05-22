import { useQuery } from "@tanstack/react-query";
import { keys } from "@/lib/queries/keys";
import { getCommentVotesAction } from "@/app/actions/comments";
import { useSession } from "@/lib/auth-client";

export const useCommentVotesQuery = (postId: string) => {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    return useQuery({
        queryKey: keys.comments.votes(postId),
        queryFn: () => getCommentVotesAction(postId),
        enabled: !!userId && !!postId,
        staleTime: 1000 * 60 * 5,
    });
};
