import React from "react";
import { Community } from "@/types/community";
import moment from "moment";

interface AboutCommunityProps {
  communityData: Community;
}

const AboutCommunity: React.FC<AboutCommunityProps> = ({ communityData }) => (
  <div className="flex w-full p-2 text-[10pt] justify-between">
    <div className="flex flex-col flex-grow">
      <span className="font-bold text-foreground">Subscribers</span>
      <span className="text-muted-foreground">{communityData.numberOfMembers.toLocaleString()}</span>
    </div>

    <div className="flex flex-col flex-grow">
      <span className="font-bold text-foreground">Created</span>
      <span className="text-muted-foreground">
        {communityData.createdAt &&
          moment(new Date(communityData.createdAt)).format("MMM DD, YYYY")}
      </span>
    </div>
  </div>
);

export default AboutCommunity;
