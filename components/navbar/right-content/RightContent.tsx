import SavedPostsModal from "@/components/modal/saved-posts/SavedPostsModal";
import { SessionUser } from "@/types/sessionUser";
import { Flex, Spinner } from "@chakra-ui/react";
import React from "react";
import AuthButtons from "./AuthButtons";
import Icons from "./Icons";
import UserMenu from "./user-menu/UserMenu";

type RightContentProps = {
  user?: SessionUser | null;
  loading?: boolean;
};

/**
 * Right content is a section of the navbar which dynamically adjusts based on state.
 * If the user is not authenticated, log in / sign up buttons (linking to the
 * central login app) are shown; otherwise the post/project icons are shown.
 * The user menu is always displayed.
 * @param user - The session user, or null when unauthenticated.
 * @param loading - Whether the session is still loading.
 * @returns {React.FC} - Right content of the navbar
 */
const RightContent: React.FC<RightContentProps> = ({ user, loading }) => {
  return (
    <>
      <SavedPostsModal />
      <Flex justify="center" align="center">
        {loading ? (
          <Spinner size="sm" m={2} />
        ) : user ? (
          <Icons />
        ) : (
          <AuthButtons />
        )}
        <UserMenu user={user} />
      </Flex>
    </>
  );
};
export default RightContent;
