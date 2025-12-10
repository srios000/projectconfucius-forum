import React from "react";
import { VStack } from "@chakra-ui/react";
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
    // add top margin to increase gap between the title and options
    <VStack mt={6} gap={3} align="stretch">
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
    </VStack>
  );
};

export default CommunityTypeOptions;
