import React from "react";
import CommunityTypeOption from "./CommunityTypeOption";

interface CommunityTypeOptionsProps {
  options: {
    name: string;
    icon: any;
    label: string;
    description: string;
  }[];
  communityType: string;
  onCommunityTypeChange: (value: string) => void;
}

const CommunityTypeOptions: React.FC<CommunityTypeOptionsProps> = ({
  options,
  communityType,
  onCommunityTypeChange,
}) => {
  return (
    <div className="mt-2.5 space-y-2">
      {options.map((option) => (
        <CommunityTypeOption
          key={option.name}
          name={option.name}
          icon={option.icon}
          label={option.label}
          description={option.description}
          isChecked={communityType === option.name}
          onChange={onCommunityTypeChange}
        />
      ))}
    </div>
  );
};

export default CommunityTypeOptions;
