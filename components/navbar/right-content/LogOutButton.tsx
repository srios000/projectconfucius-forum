import { Button } from "@chakra-ui/react";
import React from "react";

/**
 * Log out button. Delegates sign-out to the shared auth handler
 * (`/api/auth/signout`), which clears the session and redirects home.
 * @returns {React.FC} - Log out button
 */
const LogOutButton: React.FC = () => {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a page; must hit the server to clear session and redirect
    <a href="/api/auth/signout">
      <Button
        height="28px"
        display={{ base: "none", md: "flex" }}
        width={{ base: "70px", md: "110px" }}
        mr={2}
        ml={2}
      >
        Log Out
      </Button>
    </a>
  );
};
export default LogOutButton;
