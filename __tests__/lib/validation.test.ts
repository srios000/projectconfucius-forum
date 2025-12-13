/// <reference types="vitest" />

import { validateSignupForm } from "@/lib/validation";

describe("validateSignupForm", () => {
  it("flags mismatched passwords", () => {
    const result = validateSignupForm({
      password: "Password1!",
      confirmPassword: "Password2!",
    });

    expect(result).toBe("Passwords don't match");
  });

  it("requires minimum length", () => {
    const result = validateSignupForm({
      password: "P1!",
      confirmPassword: "P1!",
    });

    expect(result).toBe("Password must be at least 8 characters long");
  });

  it("requires at least one number", () => {
    const result = validateSignupForm({
      password: "Password!",
      confirmPassword: "Password!",
    });

    expect(result).toBe("Password must contain at least 1 number");
  });

  it("requires at least one special character", () => {
    const result = validateSignupForm({
      password: "Password1",
      confirmPassword: "Password1",
    });

    expect(result).toBe("Password must contain at least 1 special character");
  });

  it("requires at least one capital letter", () => {
    const result = validateSignupForm({
      password: "password1!",
      confirmPassword: "password1!",
    });

    expect(result).toBe("Password must contain at least 1 capital letter");
  });

  it("returns null for valid inputs", () => {
    const result = validateSignupForm({
      password: "Password1!",
      confirmPassword: "Password1!",
    });

    expect(result).toBeNull();
  });
});
