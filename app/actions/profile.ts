"use server";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateUserCommentsName } from "@/lib/user-profile/updateUserCommentsName";
import { updateUserPostsName } from "@/lib/user-profile/updateUserPostsName";
import { uploadProfileImage } from "@/lib/user-profile/uploadProfileImage";
import { deleteProfileImage } from "@/lib/user-profile/deleteProfileImage";

export async function profileNameAction(name: string) {
  const { userId } = await requireUser();
  const trimmed = name.trim();
  await db
    .update(users)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(users.id, userId));
  await updateUserCommentsName(userId, trimmed);
  await updateUserPostsName(userId, trimmed);
  return { userId };
}

// Phase A: image upload is deferred to Phase B. `imageUrl` is an
// already-resolved URL string; here it is only persisted.
export async function profileImageAction(imageUrl: string) {
  const { userId } = await requireUser();
  return uploadProfileImage(userId, imageUrl);
}

export async function removeProfileImageAction() {
  const { userId } = await requireUser();
  return deleteProfileImage(userId);
}
