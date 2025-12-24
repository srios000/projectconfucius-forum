import { z } from "zod";

/**
 * A Zod validation schema for updating user profile information.
 * Enforces mandatory display names with a maximum length constraint.
 */
export const editProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name cannot exceed 50 characters"),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
