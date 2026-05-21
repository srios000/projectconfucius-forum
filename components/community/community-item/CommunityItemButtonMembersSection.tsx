import React from "react";
import { Community } from "@/types/community";
import { BsFillPeopleFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";

type CommunityItemButtonMembersSectionProps = {
  community: Community;
  onJoinOrLeaveCommunity: (community: Community, isJoined: boolean) => void;
  isJoined: boolean;
};

const CommunityItemButtonMembersSection: React.FC<
  CommunityItemButtonMembersSectionProps
> = ({ community, onJoinOrLeaveCommunity, isJoined }) => {
  return (
    <div className="flex flex-row items-center justify-between w-full md:w-auto gap-3 shrink-0">
      <div className="flex items-center text-lg text-muted-foreground mr-2 gap-1">
        <BsFillPeopleFill className="size-4" />
        <span className="text-sm font-medium">{community.numberOfMembers}</span>
      </div>
      <Button
        variant={isJoined ? "outline" : "default"}
        size="sm"
        className="h-[30px] w-[130px] text-xs font-semibold"
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          event.stopPropagation();
          onJoinOrLeaveCommunity(community, isJoined);
        }}
      >
        {isJoined ? "Unsubscribe" : "Subscribe"}
      </Button>
    </div>
  );
};

export default CommunityItemButtonMembersSection;
