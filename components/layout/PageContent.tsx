import { Flex } from "@chakra-ui/react";
import React, { ReactNode } from "react";

type PageContentProps = {
  children: ReactNode;
};

/**
 * Two-column responsive layout that expects main content and an optional sidebar.
 * @param children - Array-like children where index 0 is main content and index 1 is sidebar.
 * @returns Flex container that hides the sidebar on small screens.
 */
const PageContent: React.FC<PageContentProps> = ({ children }) => {
  return (
    <Flex justify="center" p="16px 0px">
      <Flex width="95%" justify="center" maxWidth="1200px">
        {/* Left */}
        <Flex
          direction="column"
          width={{ base: "100%", md: "65%" }}
          mr={{ base: 0, md: 6 }}
        >
          {/* check if the children exist before rendering */}
          {children && children[0 as keyof typeof children]}
        </Flex>

        {/* Right */}
        <Flex
          direction="column"
          display={{ base: "none", md: "flex" }}
          flexGrow={1}
        >
          {children && children[1 as keyof typeof children]}
        </Flex>
      </Flex>
    </Flex>
  );
};
export default PageContent;
