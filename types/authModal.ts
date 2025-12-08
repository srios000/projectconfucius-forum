/**
 * Stores UI state for the authentication modal and its active screen.
 */
export interface AuthModalState {
  open: boolean;
  view: "login" | "signup" | "resetPassword";
}
