/**
 * Stores UI state for the authentication modal and its active screen.
 * Consumed by Jotai atom to control login/signup/reset flows.
 */
export interface AuthModalState {
  open: boolean;
  view: "login" | "signup" | "resetPassword";
}
