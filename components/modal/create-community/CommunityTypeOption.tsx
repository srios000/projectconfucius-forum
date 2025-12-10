import React, { FC } from "react";
import { CheckboxCard, Icon, Flex, VStack } from "@chakra-ui/react";
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
    <CheckboxCard.Root
      value={name}
      checked={isChecked}
      onCheckedChange={() => onChange(name)}
      colorPalette="red"
      borderRadius="xl"
      cursor="pointer"
    >
      <CheckboxCard.HiddenInput />
      <CheckboxCard.Control>
        <CheckboxCard.Content>
          <Flex align="center" gap={3}>
            <Icon
              as={icon}
              fontSize="24px"
              color={{ base: "gray.500", _dark: "gray.400" }}
            />
            <VStack align="start" gap={0}>
              <CheckboxCard.Label fontSize="10pt">{label}</CheckboxCard.Label>
              <CheckboxCard.Description fontSize="8pt">
                {description}
              </CheckboxCard.Description>
            </VStack>
          </Flex>
        </CheckboxCard.Content>
        <CheckboxCard.Indicator />
      </CheckboxCard.Control>
    </CheckboxCard.Root>
  );
};

export default CommunityTypeOption;
