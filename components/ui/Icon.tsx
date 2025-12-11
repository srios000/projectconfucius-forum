import { Flex, Icon } from "@chakra-ui/react";
import React from "react";
import { IconType } from "react-icons";

type IconProps = {
  icon: IconType;
  fontSize: number;
  onClick?: () => void;
  iconColor?: string;
  label?: string;
};

/**
 * Renders an icon with a hoverable chip wrapper.
 * @param props - Icon, size, optional click handler, color, and aria label.
 * @returns Clickable flex container with the icon.
 */
const IconItem: React.FC<IconProps> = ({
  icon,
  fontSize,
  onClick,
  iconColor,
  label,
}) => {
  return (
    <Flex
      mr={1.5}
      ml={1.5}
      padding={1}
      cursor="pointer"
      borderRadius={4}
      _hover={{
        bg: { base: "gray.200", _dark: "gray.700" },
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
    >
      <Icon
        as={icon}
        fontSize={fontSize}
        color={iconColor || { base: "black", _dark: "white" }}
      />
    </Flex>
  );
};

export default IconItem;
