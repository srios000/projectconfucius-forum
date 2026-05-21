import useCommunitiesFeed from "@/hooks/community/useCommunitiesFeed";
import useCommunityState from "@/hooks/community/useCommunityState";
import useCommunityMembershipActions from "@/hooks/community/useCommunityMembershipActions";
import { useRouter } from "next/navigation";
import React from "react";
import RecommendationRow from "./RecommendationRow";
import SuggestionsHeader from "./SuggestionsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Displays the top 5 communities with the most members.
 * @returns - the recommendations component.
 */
const Recommendations: React.FC = () => {
  const { communityStateValue } = useCommunityState();
  const { onJoinOrLeaveCommunity } = useCommunityMembershipActions();
  const { communities, loading } = useCommunitiesFeed({ limitValue: 5 });
  const router = useRouter();

  return (
    <div className="flex flex-col relative bg-card rounded-xl border border-border shadow-md overflow-hidden">
      <SuggestionsHeader />

      <div className="flex flex-col">
        {loading ? (
          <div className="flex flex-col gap-3 mt-2 p-3">
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <div className="flex justify-between items-center" key={index}>
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-2.5 w-[70%]" />
                </div>
              ))}
          </div>
        ) : (
          <>
            {communities.map((item, index) => {
              const isJoined = !!communityStateValue.mySnippets.find(
                (snippet) => snippet.communityId === item.id
              );
              return (
                <RecommendationRow
                  key={item.id}
                  item={item}
                  index={index}
                  isJoined={isJoined}
                  onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
                />
              );
            })}
          </>
        )}
        <div className="p-2.5 px-5">
          <Button
            variant="outline"
            className="h-8 w-full text-xs font-semibold"
            onClick={() => {
              router.push(`/communities`);
            }}
          >
            View All
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Recommendations;
