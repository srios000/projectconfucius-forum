import { z } from "zod";

/**
 * A Zod validation schema for post creation.
 * Enforces mandatory titles with length constraints and allows for optional body text.
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title cannot exceed 300 characters"),
  body: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
