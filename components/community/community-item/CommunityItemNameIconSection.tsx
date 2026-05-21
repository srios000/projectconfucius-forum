import React from "react";
import { Community } from "@/types/community";
import { IoPeopleCircleOutline } from "react-icons/io5";

type CommunityItemNameIconSectionProps = {
  community: Community;
};

const CommunityItemNameIconSection: React.FC<
  CommunityItemNameIconSectionProps
> = ({ community }) => {
  return (
    <div className="flex items-center w-full">
      <div className="flex items-center flex-row">
        {community.imageUrl ? (
          <img
            src={community.imageUrl}
            className="rounded-full size-[35px] mr-4 object-cover"
            alt="Community Icon"
          />
        ) : (
          <IoPeopleCircleOutline className="text-[38px] text-primary mr-4" />
        )}
        <span className="text-base font-medium">c/{community.id}</span>
      </div>
    </div>
  );
};

export default CommunityItemNameIconSection;
