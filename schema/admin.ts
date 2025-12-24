import { z } from "zod";

export const addAdminSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .min(3, "Email must be at least 3 characters"),
});

export type AddAdminInput = z.infer<typeof addAdminSchema>;
