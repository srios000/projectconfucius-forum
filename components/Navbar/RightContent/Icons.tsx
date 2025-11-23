/* eslint-disable react-hooks/rules-of-hooks */
import IconItem from "@/components/atoms/Icon";
import { useColorMode } from "@/components/ui/color-mode";
import useCallCreatePost from "@/hooks/useCallCreatePost";
import { Flex } from "@chakra-ui/react";
import React from "react";
import { GrAdd } from "react-icons/gr";
import { LuMoon, LuSun } from "react-icons/lu";

/**
 * Displays icons in the right side of the navbar:
 *  - Color mode toggle
 *  - Add icon for creating a new post (always visible)
 * @returns React.FC - icons in the right side of the navbar
 */
const icons: React.FC = () => {
  const { onClick } = useCallCreatePost();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Flex align="center">
      <Flex>
        <IconItem
          icon={colorMode === "light" ? LuSun : LuMoon}
          fontSize={20}
          onClick={toggleColorMode}
          label="Toggle color mode"
        />
      </Flex>
      <>
        {/* Always visible */}
        <IconItem
          icon={GrAdd}
          fontSize={20}
          onClick={onClick}
          label="Create post"
        />
      </>
    </Flex>
  );
};
export default icons;
