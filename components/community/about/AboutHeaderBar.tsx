import React from "react";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

interface AboutHeaderBarProps {
  communityName: string;
}

const AboutHeaderBar: React.FC<AboutHeaderBarProps> = ({ communityName }) => (
  <div className="flex justify-between items-center bg-primary text-primary-foreground p-3 rounded-t-xl">
    <span className="text-[10pt] font-bold">
      About c/{communityName}
    </span>
    <HiOutlineDotsHorizontal className="size-4" />
  </div>
);

export default AboutHeaderBar;
