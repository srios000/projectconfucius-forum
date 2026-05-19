import React from "react";
import { MenuContent, Flex, Stack } from "@chakra-ui/react";
import CustomMenuButton from "@/components/ui/CustomMenuButton";
import { CgProfile } from "react-icons/cg";
import { MdOutlineLogin } from "react-icons/md";
import { SessionUser } from "@/types/sessionUser";

interface UserMenuListProps {
  user: SessionUser | null | undefined;
  setProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Menu content for the user dropdown, showing profile and auth actions.
 * Auth actions delegate to the central login app.
 * @param user - Session user to decide between auth options.
 * @param setProfileModalOpen - Setter to open the profile modal.
 * @returns MenuContent with action buttons.
 */
const UserMenuList: React.FC<UserMenuListProps> = ({
  user,
  setProfileModalOpen,
}) => {
  return (
    <MenuContent borderRadius={10} mt={2} shadow="lg" minW="180px">
      <Flex justifyContent="center">
        <Stack gap={1} width="98%">
          {user ? (
            <>
              <CustomMenuButton
                icon={<CgProfile />}
                text="Profile"
                onClick={() => setProfileModalOpen(true)}
              />

              <CustomMenuButton
                icon={<MdOutlineLogin />}
                text="Log Out"
                onClick={() => window.location.assign("/api/auth/signout")}
              />
            </>
          ) : (
            <>
              <CustomMenuButton
                icon={<MdOutlineLogin />}
                text="Log In / Sign Up"
                onClick={() => window.location.assign("/api/auth/start")}
              />
            </>
          )}
        </Stack>
      </Flex>
    </MenuContent>
  );
};

export default UserMenuList;
