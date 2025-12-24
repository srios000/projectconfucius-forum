import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(21, "Name must be at most 21 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Name can only contain letters and numbers"),
  type: z.enum(["public", "restricted", "private"]),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
