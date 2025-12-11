import { MenuItem, Flex, Icon } from "@chakra-ui/react";

interface CustomMenuButtonProps {
  icon: React.ReactElement;
  text: string;
  onClick: () => void;
}

/**
 * Custom menu button component for various menus.
 * @param props - Icon, label text, and click handler.
 * @returns Menu item styled for dropdown lists.
 */
const CustomMenuButton: React.FC<CustomMenuButtonProps> = ({
  icon,
  text,
  onClick,
}) => {
  return (
    <MenuItem
      fontSize="10pt"
      fontWeight={700}
      onClick={onClick}
      height="40px"
      borderRadius={10}
      alignContent="center"
      _hover={{
        bg: { base: "gray.300", _dark: "gray.600" },
        color: { base: "black", _dark: "white" },
      }}
    >
      <Flex align="center">
        <Icon fontSize={20} mr={2} mt={1}>
          {icon}
        </Icon>
        {text}
      </Flex>
    </MenuItem>
  );
};

export default CustomMenuButton;
