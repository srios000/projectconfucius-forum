import React from "react";
import { Community } from "@/types/community";
import Link from "next/link";
import { IoPeopleCircleOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";

type RecommendationRowProps = {
  item: Community;
  index: number;
  isJoined: boolean;
  onJoinOrLeaveCommunity: (community: Community, isJoined: boolean) => void;
};

const RecommendationRow: React.FC<RecommendationRowProps> = ({
  item,
  index,
  isJoined,
  onJoinOrLeaveCommunity,
}) => {
  return (
    <Link key={item.id} href={`/c/${item.id}`}>
      <div className="flex items-center justify-between text-[10pt] p-2.5 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <span className="shrink-0 w-5 text-muted-foreground">{index + 1}</span>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              className="rounded-full size-7 shrink-0 object-cover"
              alt="Community Icon"
            />
          ) : (
            <IoPeopleCircleOutline className="text-[34px] text-primary shrink-0" />
          )}
          <span className="font-semibold text-[10pt] overflow-hidden text-ellipsis whitespace-nowrap">
            c/{item.id}
          </span>
        </div>
        <Button
          variant={isJoined ? "outline" : "default"}
          size="sm"
          className="h-6 text-[8pt] px-3 shrink-0 font-semibold"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            onJoinOrLeaveCommunity(item, isJoined);
          }}
        >
          {isJoined ? "Unsubscribe" : "Subscribe"}
        </Button>
      </div>
    </Link>
  );
};

export default RecommendationRow;
