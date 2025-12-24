import { z } from "zod";

export const editProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name cannot exceed 50 characters"),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
