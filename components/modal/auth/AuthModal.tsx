"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import { authModalStateAtom } from "@/atoms/authModalAtom";
import { auth } from "@/firebase/clientApp";
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Separator,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import AuthInputs from "./AuthInputs";
import ResetPassword from "./ResetPassword";
import OAuthButtons from "./oauth-buttons/OAuthButtons";

/**
 * Auth modal that switches between login, signup, and reset views based on atom state.
 * Auto-closes when Firebase auth yields a user.
 * @returns Dialog shell with auth form or reset password flow.
 * @see https://chakra-ui.com/docs/components/dialog
 */
const AuthModal: React.FC = () => {
  const [modalState, setModalState] = useAtom(authModalStateAtom);
  /**
   * Keeps track of whether a user is authenticated via Firebase.
   * It returns the `user` details, if it fails then `null` is stored.
   * While communicating with Firebase, `loading` (boolean) is set to `true` and
   * once the communication is complete it is set to `false`.
   * `error` is null until an error takes place while communicating with Firebase.
   */
  const [user, loading, error] = useAuthState(auth);

  /**
   * If a user is authenticated, the modal will automatically close.
   * This is used after signing up or logging in as once the user is authenticated,
   * the modal does not need to be open.
   */
  useEffect(() => {
    if (user) handleClose();
  }, [user]);

  /**
   * Closes the authentication modal by setting its state to `open` state to false.
   */
  const handleClose = () => {
    setModalState((prev) => ({
      ...prev,
      open: false,
    }));
  };
  return (
    <DialogRoot
      open={modalState.open}
      onOpenChange={({ open }: { open: boolean }) => {
        if (!open) handleClose();
      }}
    >
      <DialogBackdrop bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(6px)" />
      <DialogPositioner>
        <DialogContent borderRadius={10}>
          <DialogHeader textAlign="center">
            <DialogTitle>
              {modalState.view === "login" && "Login"}
              {modalState.view === "signup" && "Sign Up"}
              {modalState.view === "resetPassword" && "Reset Password"}
            </DialogTitle>
          </DialogHeader>

          <DialogCloseTrigger position="absolute" top={2} right={2} />

          <DialogBody
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            pb={6}
          >
            <Flex
              direction="column"
              align="center"
              justify="center"
              width="75%"
            >
              {/* If user is trying to authenticate (log in or sign up) */}
              {modalState.view === "login" || modalState.view === "signup" ? (
                <>
                  <OAuthButtons />
                  {/* <Text color='gray.500' fontWeight={700}>OR</Text> */}
                  <Separator />
                  <AuthInputs />
                </>
              ) : (
                // If user is trying to reset password
                <ResetPassword />
              )}
            </Flex>
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};
export default AuthModal;
