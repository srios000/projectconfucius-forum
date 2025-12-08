import React, { ReactNode } from "react";
import Navbar from "../navbar/Navbar";
import GlobalHooks from "./GlobalHooks";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Wraps pages with global hooks and the site navbar.
 * @param children - Page content to display below the navbar.
 * @returns Layout shell rendered on every page.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <GlobalHooks />
      <Navbar />
      <main>{children}</main>
    </>
  );
};
export default Layout;
