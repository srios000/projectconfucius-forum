import React from "react";

type CommunityNameProps = {
  id: string;
};

const CommunityName: React.FC<CommunityNameProps> = ({ id }) => {
  return (
    <div className="flex flex-col mr-6">
      <span className="font-extrabold text-[16pt] text-foreground">
        c/{id}
      </span>
    </div>
  );
};

export default CommunityName;
