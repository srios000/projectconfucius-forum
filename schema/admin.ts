import { z } from "zod";

/**
 * A Zod validation schema for promoting a user to community admin.
 * Validates that a properly formatted email address is provided for the search.
 */
export const addAdminSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .min(3, "Email must be at least 3 characters"),
});

export type AddAdminInput = z.infer<typeof addAdminSchema>;
