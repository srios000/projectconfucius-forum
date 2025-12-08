import { atom } from "jotai";
import { AuthModalState } from "@/types/authModal";

/**
 * Describes the default state of the authentication modal.
 * By default, the modal is closed and
 * if no state is specified, it will open in the log in view.
 * @property open - modal is closed by default
 * @property view - log in view is displayed by default
 */
const defaultModalState: AuthModalState = {
  open: false,
  view: "login",
};

/**
 * Controls whether the auth modal is visible and which screen is active.
 * @returns Jotai atom with open flag and active view.
 */
export const authModalStateAtom = atom<AuthModalState>(defaultModalState);
