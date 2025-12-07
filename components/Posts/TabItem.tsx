import { Flex, Icon, Text } from "@chakra-ui/react";
import React from "react";
import { FormTab } from "./new-post-form/NewPostForm";

/**
 * TabItem component for displaying tabs at the top of the NewPostForm.
 * @param {FormTab} item - FormTab object from NewPostForm
 * @param {boolean} selected - whether the tab is selected or not
 * @param {function} setSelectedTab - selecting a tab
 */
type TabItemProps = {
  item: FormTab;
  selected: boolean;
  setSelectedTab: (value: string) => void;
};

/**
 * Displays tab buttons at the top of the NewPostForm.
 * Allows the user to select a tab to display the form for that tab.
 * @param {FormTab} item - FormTab object from NewPostForm
 * @param {boolean} selected - whether the tab is selected or not
 * @param {() => {}} setSelectedTab - selecting a tab
 *
 * @returns {React.FC<TabItemProps>} - TabItem component for NewPostForm
 */
const TabItem: React.FC<TabItemProps> = ({
  item,
  selected,
  setSelectedTab,
}) => {
  return (
    <Flex
      justify="center"
      align="center"
      fontWeight={800}
      fontSize="16pt"
      flexGrow={1}
      width={0} // split icons evenly
      p="14px 0px"
      cursor="pointer"
      _hover={{
        bg: { base: "gray.50", _dark: "gray.700" },
        boxShadow: "sm",
      }}
      color={
        selected
          ? { base: "red.500", _dark: "red.400" }
          : { base: "gray.500", _dark: "gray.400" }
      }
      borderWidth="1px"
      borderColor={
        selected
          ? { base: "red.500", _dark: "red.400" }
          : { base: "gray.200", _dark: "gray.600" }
      }
      borderRadius={10}
      onClick={() => setSelectedTab(item.title)}
      shadow="md"
    >
      <Flex align="center" height="20px" mr={2}>
        <Icon as={item.icon} />
      </Flex>
      <Text fontSize="10pt">{item.title}</Text>
    </Flex>
  );
};
export default TabItem;
