import { z } from "zod";

/**
 * A Zod validation schema for user authentication (login).
 * Ensures the email is correctly formatted and the password is provided.
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * A Zod validation schema for new user registration (sign-up).
 * Enforces email formatting, minimum password length, and ensures the password confirmation matches.
 */
export const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * A Zod validation schema for password reset requests.
 * Validates that a properly formatted email address is provided.
 */
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
