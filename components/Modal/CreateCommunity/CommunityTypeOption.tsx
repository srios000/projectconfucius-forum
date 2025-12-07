import React, { FC } from "react";
import { Icon, Text, Flex } from "@chakra-ui/react";
import {
  CheckboxControl,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxRoot,
} from "@chakra-ui/react";
import type { IconType } from "react-icons";

type CommunityTypeOptionProps = {
  name: string;
  icon: IconType;
  label: string;
  description: string;
  isChecked: boolean;
  onChange: (value: string) => void;
};

const CommunityTypeOption: FC<CommunityTypeOptionProps> = ({
  name,
  icon,
  label,
  description,
  isChecked,
  onChange,
}) => {
  return (
    <CheckboxRoot
      value={name}
      checked={isChecked}
      onCheckedChange={() => onChange(name)}
      colorPalette="red"
      display="flex"
      alignItems="center"
      gap={2}
      cursor="pointer"
      py={1}
    >
      <CheckboxControl>
        <CheckboxIndicator />
      </CheckboxControl>
      <CheckboxLabel flex="1">
        <Flex align="center">
          <Icon
            as={icon}
            color={{ base: "gray.500", _dark: "gray.400" }}
            mr={2}
          />
          <Text fontSize="10pt" mr={1}>
            {label}
          </Text>
          <Text
            fontSize="8pt"
            color={{ base: "gray.500", _dark: "gray.400" }}
            pt={1}
          >
            {description}
          </Text>
        </Flex>
      </CheckboxLabel>
    </CheckboxRoot>
  );
};

export default CommunityTypeOption;
