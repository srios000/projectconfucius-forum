import { atom } from "jotai";
import { AuthModalState } from "@/types/authModal";

/**
 * Describes the default state of the authentication modal.
 * By default, the modal is closed and
 * if no state is specified, it will open in the log in view.
 * @property {boolean} open - modal is closed by default
 * @property {"login"} view - log in view is displayed by default
 */
const defaultModalState: AuthModalState = {
  open: false,
  view: "login",
};

/**
 * Atom which describes the state of the authentication modal.
 *
 * @requires AuthModalState - state definition
 * @requires defaultModalState - default state
 *
 * @see https://jotai.org/docs/core/atom
 */
export const authModalStateAtom = atom<AuthModalState>(defaultModalState);
