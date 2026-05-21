import { Community } from "@/types/community";
import { useRouter } from "next/navigation";
import React from "react";
import CommunityItemNameIconSection from "./CommunityItemNameIconSection";
import CommunityItemButtonMembersSection from "./CommunityItemButtonMembersSection";

interface CommunityItemProps {
  community: Community;
  isJoined: boolean;
  onJoinOrLeaveCommunity: (community: Community, isJoined: boolean) => void;
}

const CommunityItem: React.FC<CommunityItemProps> = ({
  community,
  isJoined,
  onJoinOrLeaveCommunity,
}) => {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        router.push(`/c/${community.id}`);
      }}
      className="flex items-center text-[10pt] border border-border p-3.5 rounded-xl bg-card hover:border-border/80 cursor-pointer shadow-md transition-shadow hover:shadow-sm"
    >
      <div className="flex flex-col md:flex-row flex-grow items-start md:items-center justify-between gap-3 w-full">
        <CommunityItemNameIconSection community={community} />
        <CommunityItemButtonMembersSection
          community={community}
          onJoinOrLeaveCommunity={onJoinOrLeaveCommunity}
          isJoined={isJoined}
        />
      </div>
    </div>
  );
};

export default CommunityItem;
