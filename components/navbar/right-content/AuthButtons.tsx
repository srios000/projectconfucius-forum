import { Button } from "@chakra-ui/react";
import React from "react";

/**
 * Log In / Sign Up buttons. Both delegate to the central login app
 * (`/api/auth/start`); the forum has no local auth UI.
 * @returns {React.FC} - Authentication buttons (log in and sign up)
 */
const AuthButtons: React.FC = () => {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a page; must hit the server to redirect to the central login app */}
      <a href="/api/auth/start">
        <Button
          variant="outline"
          height="28px"
          display={{ base: "none", md: "flex" }}
          width={{ base: "70px", md: "110px" }}
          mr={2}
          ml={2}
        >
          Log In
        </Button>
      </a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a page; must hit the server to redirect to the central login app */}
      <a href="/api/auth/start">
        <Button
          height="28px"
          display={{ base: "none", md: "flex" }}
          width={{ base: "70px", md: "110px" }}
          mr={2}
        >
          Sign Up
        </Button>
      </a>
    </>
  );
};
export default AuthButtons;
