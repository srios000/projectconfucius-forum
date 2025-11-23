import { Flex, Icon } from "@chakra-ui/react";
import React from "react";
import { IconType } from "react-icons";

/**
 * @param {IconType} icon - Icon to be displayed
 * @param {number} fontSize - Font size of the icon
 * @param {() => void} onClick - Function to be executed when the button is clicked
 * @param {string} iconColor - Color of the icon
 */
type IconProps = {
  icon: IconType;
  fontSize: number;
  onClick?: () => void;
  iconColor?: string;
  label?: string;
};

/**
 * Displays an icon with a hover effect.
 * Takes some props to render the icon and to execute a function when the icon is clicked.
 * @param {IconType} icon - Icon to be displayed
 * @param {number} fontSize - Font size of the icon
 * @param {() => void} onClick - Function to be executed when the button is clicked
 * @param {string} iconColor - Color of the icon (default: black)
 * @param {string} label - Aria label for the icon
 *
 * @returns {React.FC<IconProps>} - Icon with a hover effect
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
