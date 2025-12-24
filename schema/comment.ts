import { z } from "zod";

/**
 * A Zod validation schema for comment creation.
 * Ensures that the comment text is provided and is not an empty string.
 */
export const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty"),
});

export type CommentInput = z.infer<typeof commentSchema>;
