import { Button } from "@chakra-ui/react";
import React from "react";

/**
 * Log out button. Delegates sign-out to the shared auth handler
 * (`/api/auth/signout`), which clears the session and redirects home.
 * @returns {React.FC} - Log out button
 */
const LogOutButton: React.FC = () => {
  return (
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
