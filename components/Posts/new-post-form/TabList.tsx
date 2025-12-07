import React from "react";
import { Stack } from "@chakra-ui/react";
import TabItem from "../TabItem";

type FormTabShape = { title: string; icon: any };

type TabListProps = {
  formTabs: FormTabShape[];
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
};

const TabList: React.FC<TabListProps> = ({
  formTabs,
  selectedTab,
  setSelectedTab,
}) => {
  return (
    <Stack width="100%" direction="row" gap={2} p={2}>
      {formTabs.map((item) => (
        <TabItem
          key={item.title}
          item={item}
          selected={item.title === selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ))}
    </Stack>
  );
};

export default TabList;
