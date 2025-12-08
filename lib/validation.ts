/**
 * Validates password strength and match for the signup form.
 * @param form.password - Raw password input.
 * @param form.confirmPassword - Confirmation field to compare.
 * @returns Error message when invalid, otherwise null.
 */
export const validateSignupForm = (form: {
  password: string;
  confirmPassword: string;
}) => {
  if (form.password !== form.confirmPassword) {
    return "Passwords don't match";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/\d/.test(form.password)) {
    return "Password must contain at least 1 number";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
    return "Password must contain at least 1 special character";
  }
  if (!/[A-Z]/.test(form.password)) {
    return "Password must contain at least 1 capital letter";
  }
  return null;
};
