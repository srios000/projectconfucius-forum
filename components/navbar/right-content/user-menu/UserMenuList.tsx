import React from "react";
import { MenuContent, Flex, Stack } from "@chakra-ui/react";
import CustomMenuButton from "@/components/ui/CustomMenuButton";
import { CgProfile } from "react-icons/cg";
import { MdOutlineLogin } from "react-icons/md";
import {
  MdOutlineLogin as MdOutlineLoginAlias,
  MdOutlineLogin as MdOutlineLoginAlias2,
} from "react-icons/md";
import { useSetAtom } from "jotai";
import { authModalStateAtom } from "@/atoms/authModalAtom";
import { signOut, User } from "firebase/auth";
import { auth } from "@/firebase/clientApp";

interface UserMenuListProps {
  user: User | null | undefined;
  setProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Menu content for the user dropdown, showing profile and auth actions.
 * @param user - Firebase user to decide between auth options.
 * @param setProfileModalOpen - Setter to open the profile modal.
 * @returns MenuContent with action buttons.
 */
const UserMenuList: React.FC<UserMenuListProps> = ({
  user,
  setProfileModalOpen,
}) => {
  const setAuthModalState = useSetAtom(authModalStateAtom);

  const logout = async () => {
    await signOut(auth);
  };

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
                onClick={logout}
              />
            </>
          ) : (
            <>
              <CustomMenuButton
                icon={<MdOutlineLoginAlias />}
                text="Log In / Sign Up"
                onClick={() => setAuthModalState({ open: true, view: "login" })}
              />
            </>
          )}
        </Stack>
      </Flex>
    </MenuContent>
  );
};

export default UserMenuList;
