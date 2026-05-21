import React from "react";
import { HiArrowCircleUp } from "react-icons/hi";

type CommunityIconProps = {
  imageURL?: string;
};

const CommunityIcon: React.FC<CommunityIconProps> = ({ imageURL }) => {
  return imageURL ? (
    <img
      src={imageURL}
      className="rounded-full size-[66px] alt='Community icons' border-3 border-card shadow-md object-cover"
      alt="Community icons"
    />
  ) : (
    <HiArrowCircleUp className="size-[64px] text-primary border-3 border-card rounded-full bg-card shadow-md" />
  );
};

export default CommunityIcon;
